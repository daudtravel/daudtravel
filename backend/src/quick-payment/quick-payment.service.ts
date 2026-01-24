import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { getBOGAccessToken } from '@/common/utils/bog-auth';
import { BOG_API_URL, verifyBOGSignature } from '@/common/utils/bog-payments';
import { PaymentStatus } from '@prisma/client';
import {
  CreateQuickLinkDto,
  UpdateQuickLinkDto,
  InitiatePaymentDto,
} from './dto/quick-payment.dto';
import { FileUploadService } from '@/common/utils/file-upload.util';
import { getPrimaryFrontendUrl } from '@/common/utils/frontend-url.util';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class QuickPaymentService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
    private mailService: MailService,
  ) {}

  private generateSlug(): string {
    return uuidv4().split('-')[0];
  }

  private getDefaultLocale(): string {
    return 'ka';
  }

  async createQuickLink(dto: CreateQuickLinkDto) {
    let imageUrl: string | null = null;

    if (dto.image) {
      const uploaded = await this.fileUpload.uploadBase64Image(
        dto.image,
        'quick-payments',
      );
      imageUrl = uploaded.url;
    }

    const slug = this.generateSlug();

    // Create link with localizations
    const link = await this.prisma.quickPaymentLink.create({
      data: {
        slug,
        image: imageUrl,
        price: dto.price,
        showOnWebsite: dto.showOnWebsite ?? false,
        localizations: {
          create: dto.localizations.map((loc) => ({
            locale: loc.locale,
            name: loc.name,
            description: loc.description,
          })),
        },
      },
      include: {
        localizations: true,
      },
    });

    const frontendUrl = getPrimaryFrontendUrl();
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    return {
      success: true,
      data: {
        id: link.id,
        slug: link.slug,
        image: link.image,
        price: Number(link.price),
        paymentLink: `${frontendUrl}/pay/${link.slug}`,
        isActive: link.isActive,
        showOnWebsite: link.showOnWebsite,
        localizations: link.localizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
        })),
        createdAt: link.createdAt.toISOString(),
      },
    };
  }

  // Update the getQuickLink method in your quick-payment.service.ts (backend)

  async getQuickLink(
    slug: string,
    locale?: string,
    isAuthenticated: boolean = false,
  ) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
      include: {
        localizations: true, // Always include all localizations
      },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    // For non-authenticated public requests, check if active
    if (!isAuthenticated && !link.isActive) {
      throw new BadRequestException('This payment link is no longer active');
    }

    // If authenticated, return all localizations (for editing/management)
    if (isAuthenticated) {
      return {
        success: true,
        data: {
          id: link.id,
          slug: link.slug,
          image: link.image,
          price: Number(link.price),
          isActive: link.isActive,
          showOnWebsite: link.showOnWebsite,
          localizations: link.localizations.map((loc) => ({
            locale: loc.locale,
            name: loc.name,
            description: loc.description,
          })),
          createdAt: link.createdAt.toISOString(),
        },
      };
    }

    // For public requests, return single localization (for payment page)
    const requestedLocale = locale || this.getDefaultLocale();
    const localization = link.localizations.find(
      (l) => l.locale === requestedLocale,
    );

    if (!localization && link.localizations.length === 0) {
      throw new NotFoundException('No translations available for this link');
    }

    // Fallback to first available locale if requested locale not found
    const selectedLoc = localization || link.localizations[0];

    return {
      success: true,
      data: {
        id: link.id,
        name: selectedLoc.name,
        description: selectedLoc.description,
        image: link.image,
        price: Number(link.price),
        locale: selectedLoc.locale,
        availableLocales: link.localizations.map((l) => l.locale),
      },
    };
  }
  async initiatePayment(slug: string, dto: InitiatePaymentDto) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
      include: {
        localizations: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (!link.isActive) {
      throw new BadRequestException('This payment link is no longer active');
    }

    const requestedLocale = dto.locale || this.getDefaultLocale();
    const localization = link.localizations.find(
      (l) => l.locale === requestedLocale,
    );
    const selectedLoc = localization || link.localizations[0];

    if (!selectedLoc) {
      throw new NotFoundException('No translations available for this link');
    }

    // ✅ Handle quantity (default: 1, min: 1, max: 100)
    const quantity = Math.max(1, Math.min(100, dto.quantity || 1));
    const unitPrice = Number(link.price);
    const totalAmount = unitPrice * quantity;

    const external_order_id = `QP_${uuidv4()}`;
    const accessToken = await getBOGAccessToken();
    const frontendUrl = getPrimaryFrontendUrl();

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    const bogOrderRequest = {
      callback_url: `${process.env.BASE_URL}/api/quick-payment/bog/callback`,
      external_order_id,
      purchase_units: {
        currency: 'GEL',
        total_amount: totalAmount, // ✅ Total based on quantity
        basket: [
          {
            product_id: link.id,
            description: selectedLoc.name,
            quantity: quantity, // ✅ Dynamic quantity
            unit_price: unitPrice,
            total_price: totalAmount,
          },
        ],
      },
      redirect_urls: {
        success: `${frontendUrl}/payment/success?order_id=${external_order_id}`,
        fail: `${frontendUrl}/payment/failure?order_id=${external_order_id}`,
      },
      ttl: 30,
    };

    const bogResponse = await fetch(`${BOG_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Accept-Language': 'en',
        'Idempotency-Key': uuidv4(),
      },
      body: JSON.stringify(bogOrderRequest),
    });

    if (!bogResponse.ok) {
      const errorText = await bogResponse.text();
      console.error('❌ BOG API Error:', errorText);
      throw new InternalServerErrorException('Failed to create payment');
    }

    const bogOrderData = await bogResponse.json();

    await this.prisma.quickPaymentOrder.create({
      data: {
        linkId: link.id,
        customerFullName: dto.customerFullName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        productName: selectedLoc.name,
        productDescription: selectedLoc.description,
        productUnitPrice: link.price, // ✅ Store unit price
        productQuantity: quantity, // ✅ Store quantity
        productTotalPrice: totalAmount, // ✅ Store total
        productLocale: selectedLoc.locale,
        externalOrderId: external_order_id,
        bogOrderId: bogOrderData.id,
        paymentUrl: bogOrderData._links.redirect.href,
        status: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return {
      success: true,
      paymentUrl: bogOrderData._links.redirect.href,
      totalAmount: totalAmount, // ✅ Return total to frontend
      quantity: quantity,
    };
  }

  async handleBOGCallback(rawBody: string, signature: string) {
    if (!signature || !verifyBOGSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const callbackData = JSON.parse(rawBody);
    if (callbackData.event !== 'order_payment') {
      throw new BadRequestException('Invalid event type');
    }

    const orderData = callbackData.body;
    const statusKey = (orderData.order_status?.key || '').toLowerCase();

    let finalStatus: PaymentStatus = PaymentStatus.PENDING;

    if (statusKey === 'completed' || statusKey === 'partial_completed') {
      finalStatus = PaymentStatus.PAID;
    } else if (statusKey === 'rejected' || statusKey === 'failed') {
      finalStatus = PaymentStatus.FAILED;
    }

    const updateData: any = {
      status: finalStatus,
      transactionId: orderData.transaction_id,
      paymentMethod: orderData.payment_method,
      callbackData: orderData,
      paidAt: finalStatus === PaymentStatus.PAID ? new Date() : undefined,
      failedAt: finalStatus === PaymentStatus.FAILED ? new Date() : undefined,
    };

    const order = await this.prisma.quickPaymentOrder.findFirst({
      where: {
        OR: [
          { bogOrderId: orderData.order_id },
          { externalOrderId: orderData.external_order_id },
        ],
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.quickPaymentOrder.update({
      where: { id: order.id },
      data: updateData,
    });

    if (finalStatus === PaymentStatus.PAID && !order.emailSent) {
      await this.sendEmailNotifications(order.id);
    }

    return {
      success: true,
      status: finalStatus,
    };
  }

  // ✅ ADD THIS PRIVATE METHOD
  private async sendEmailNotifications(orderId: string) {
    try {
      const order = await this.prisma.quickPaymentOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) return;

      // Send customer confirmation
      if (order.customerEmail) {
        await this.mailService.sendQuickPaymentCustomerConfirmation({
          email: order.customerEmail,
          customerFullName: order.customerFullName,
          externalOrderId: order.externalOrderId,
          productName: order.productName,
          productDescription: order.productDescription ?? undefined,
          quantity: order.productQuantity,
          totalAmount: Number(order.productTotalPrice),
        });
      }

      // Send admin notification
      const adminEmail = process.env.ADMIN_EMAIL || 'traveldaud@gmail.com';
      await this.mailService.sendQuickPaymentAdminNotification({
        order: {
          id: order.id,
          externalOrderId: order.externalOrderId,
          customerFullName: order.customerFullName,
          customerEmail: order.customerEmail ?? undefined,
          customerPhone: order.customerPhone ?? undefined,
          productName: order.productName,
          productDescription: order.productDescription ?? undefined,
          quantity: order.productQuantity,
          totalAmount: Number(order.productTotalPrice),
          transactionId: order.transactionId ?? undefined,
          paymentMethod: order.paymentMethod ?? undefined,
          paidAt: order.paidAt ?? undefined,
        },
        adminEmail,
      });

      // Mark email as sent
      await this.prisma.quickPaymentOrder.update({
        where: { id: orderId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('❌ Failed to send email notifications:', error);
    }
  }

  async getPublicLinks(locale?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const requestedLocale = locale || this.getDefaultLocale();

    const [links, total] = await Promise.all([
      this.prisma.quickPaymentLink.findMany({
        where: {
          isActive: true,
          showOnWebsite: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          localizations: {
            where: { locale: requestedLocale },
          },
        },
      }),
      this.prisma.quickPaymentLink.count({
        where: {
          isActive: true,
          showOnWebsite: true,
        },
      }),
    ]);

    const frontendUrl = getPrimaryFrontendUrl();
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    return {
      success: true,
      data: links
        .filter((link) => link.localizations.length > 0)
        .map((link) => ({
          id: link.id,
          slug: link.slug,
          name: link.localizations[0].name,
          description: link.localizations[0].description,
          image: link.image,
          price: Number(link.price),
          paymentLink: `${frontendUrl}/pay/${link.slug}`,
          createdAt: link.createdAt.toISOString(),
        })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllLinks(locale?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const requestedLocale = locale || this.getDefaultLocale();

    const [links, total] = await Promise.all([
      this.prisma.quickPaymentLink.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          localizations: locale ? { where: { locale: requestedLocale } } : true,
          _count: {
            select: {
              orders: {
                where: { status: PaymentStatus.PAID },
              },
            },
          },
        },
      }),
      this.prisma.quickPaymentLink.count(),
    ]);

    const frontendUrl = getPrimaryFrontendUrl();
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    return {
      success: true,
      data: links.map((link) => {
        const defaultLoc = link.localizations[0];
        return {
          id: link.id,
          slug: link.slug,
          name: defaultLoc?.name || 'No translation',
          description: defaultLoc?.description,
          image: link.image,
          price: Number(link.price),
          isActive: link.isActive,
          showOnWebsite: link.showOnWebsite,
          paidOrdersCount: link._count.orders,
          paymentLink: `${frontendUrl}/pay/${link.slug}`,
          localizations: locale ? undefined : link.localizations,
          createdAt: link.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateLink(slug: string, dto: UpdateQuickLinkDto) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
      include: { localizations: true },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    let imageUrl = link.image;

    if (dto.image) {
      if (link.image) {
        await this.fileUpload.deleteFile(link.image);
      }
      const uploaded = await this.fileUpload.uploadBase64Image(
        dto.image,
        'quick-payments',
      );
      imageUrl = uploaded.url;
    }

    const updateData: any = {
      image: imageUrl,
    };

    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.showOnWebsite !== undefined)
      updateData.showOnWebsite = dto.showOnWebsite;

    // Handle localizations update
    if (dto.localizations && dto.localizations.length > 0) {
      updateData.localizations = {
        deleteMany: {},
        create: dto.localizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
        })),
      };
    }

    const updated = await this.prisma.quickPaymentLink.update({
      where: { slug },
      data: updateData,
      include: { localizations: true },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
        image: updated.image,
        price: Number(updated.price),
        isActive: updated.isActive,
        showOnWebsite: updated.showOnWebsite,
        localizations: updated.localizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
        })),
      },
    };
  }

  async toggleLinkStatus(slug: string) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    const updated = await this.prisma.quickPaymentLink.update({
      where: { slug },
      data: { isActive: !link.isActive },
    });

    return {
      success: true,
      isActive: updated.isActive,
    };
  }

  async deleteLink(slug: string) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (link.image) {
      await this.fileUpload.deleteFile(link.image);
    }

    await this.prisma.quickPaymentLink.delete({
      where: { slug },
    });

    return {
      success: true,
      message: 'Payment link deleted',
    };
  }

  async getPaymentStatus(externalOrderId: string) {
    const order = await this.prisma.quickPaymentOrder.findUnique({
      where: { externalOrderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      data: {
        id: order.id,
        status: order.status,
        customerFullName: order.customerFullName,
        productName: order.productName,
        productDescription: order.productDescription,
        productUnitPrice: Number(order.productUnitPrice),
        productQuantity: order.productQuantity,
        productTotalPrice: Number(order.productTotalPrice),
        productLocale: order.productLocale,
        paidAt: order.paidAt?.toISOString(),
        createdAt: order.createdAt.toISOString(),
      },
    };
  }

  async getAllOrders(
    linkId?: string,
    status?: PaymentStatus,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (linkId) whereClause.linkId = linkId;
    if (status) whereClause.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.quickPaymentOrder.findMany({
        where: whereClause,
        include: {
          link: {
            select: {
              slug: true,
              image: true,
              localizations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quickPaymentOrder.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: orders.map((order) => ({
        id: order.id,
        externalOrderId: order.externalOrderId,
        customerFullName: order.customerFullName,
        productName: order.productName,
        productDescription: order.productDescription,
        productUnitPrice: Number(order.productUnitPrice),
        productQuantity: order.productQuantity,
        productTotalPrice: Number(order.productTotalPrice),
        productLocale: order.productLocale,
        status: order.status,
        linkSlug: order.link?.slug ?? null,
        linkImage: order.link?.image ?? null,
        transactionId: order.transactionId,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt?.toISOString(),
        failedAt: order.failedAt?.toISOString(),
        createdAt: order.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.quickPaymentOrder.findUnique({
      where: { id: orderId },
      include: {
        link: {
          select: {
            slug: true,
            image: true,
            localizations: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      data: {
        id: order.id,
        externalOrderId: order.externalOrderId,
        bogOrderId: order.bogOrderId,
        customerFullName: order.customerFullName,
        productName: order.productName,
        productDescription: order.productDescription,
        productUnitPrice: Number(order.productUnitPrice),
        productQuantity: order.productQuantity,
        productTotalPrice: Number(order.productTotalPrice),
        productLocale: order.productLocale,
        status: order.status,
        linkSlug: order.link?.slug ?? null,
        linkImage: order.link?.image ?? null,
        transactionId: order.transactionId,
        paymentMethod: order.paymentMethod,
        paymentUrl: order.paymentUrl,
        callbackData: order.callbackData,
        expiresAt: order.expiresAt.toISOString(),
        paidAt: order.paidAt?.toISOString(),
        failedAt: order.failedAt?.toISOString(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    };
  }

  async deleteOrder(orderId: string) {
    const order = await this.prisma.quickPaymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot delete paid orders');
    }

    await this.prisma.quickPaymentOrder.delete({
      where: { id: orderId },
    });

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  }
}
