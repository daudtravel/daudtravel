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

@Injectable()
export class QuickPaymentService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  private generateSlug(): string {
    return uuidv4().split('-')[0];
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

    const link = await this.prisma.quickPaymentLink.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        image: imageUrl,
        price: dto.price,
        showOnWebsite: dto.showOnWebsite ?? false, // ✅ NEW
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
        name: link.name,
        description: link.description,
        image: link.image,
        price: Number(link.price),
        paymentLink: `${frontendUrl}/pay/${link.slug}`,
        isActive: link.isActive,
        showOnWebsite: link.showOnWebsite, // ✅ NEW
        createdAt: link.createdAt.toISOString(),
      },
    };
  }

  async getQuickLink(slug: string) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (!link.isActive) {
      throw new BadRequestException('This payment link is no longer active');
    }

    return {
      success: true,
      data: {
        id: link.id,
        name: link.name,
        description: link.description,
        image: link.image,
        price: Number(link.price),
      },
    };
  }

  async initiatePayment(slug: string, dto: InitiatePaymentDto) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (!link.isActive) {
      throw new BadRequestException('This payment link is no longer active');
    }

    const external_order_id = `QP_${uuidv4()}`;
    const accessToken = await getBOGAccessToken();
    const amount = Number(link.price);

    const frontendUrl = getPrimaryFrontendUrl();

    // Also update the error check:
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
        total_amount: amount,
        basket: [
          {
            product_id: link.id,
            description: link.name,
            quantity: 1,
            unit_price: amount,
            total_price: amount,
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

    // ✅ THIS IS THE IMPORTANT PART - MAKE SURE THESE TWO LINES ARE ADDED
    await this.prisma.quickPaymentOrder.create({
      data: {
        linkId: link.id,
        customerFullName: dto.customerFullName,
        customerEmail: dto.customerEmail, // ✅ REQUIRED
        customerPhone: dto.customerPhone, // ✅ OPTIONAL
        productName: link.name,
        productDescription: link.description,
        productPrice: link.price,
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

    return {
      success: true,
      status: finalStatus,
    };
  }

  // ✅ NEW: Get public website links
  async getPublicLinks(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      this.prisma.quickPaymentLink.findMany({
        where: {
          isActive: true,
          showOnWebsite: true, // ✅ Only show links marked for website
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          image: true,
          price: true,
          createdAt: true,
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

    // Also update the error check:
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    return {
      success: true,
      data: links.map((link) => ({
        id: link.id,
        slug: link.slug,
        name: link.name,
        description: link.description,
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

  // Admin: Get all links (including private ones)
  async getAllLinks(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      this.prisma.quickPaymentLink.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
      data: links.map((link) => ({
        id: link.id,
        slug: link.slug,
        name: link.name,
        description: link.description,
        image: link.image,
        price: Number(link.price),
        isActive: link.isActive,
        showOnWebsite: link.showOnWebsite, // ✅ NEW
        paidOrdersCount: link._count.orders,
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

  async updateLink(slug: string, dto: UpdateQuickLinkDto) {
    const link = await this.prisma.quickPaymentLink.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    let imageUrl = link.image;

    if (dto.image) {
      // Delete old image if exists
      if (link.image) {
        await this.fileUpload.deleteFile(link.image);
      }

      const uploaded = await this.fileUpload.uploadBase64Image(
        dto.image,
        'quick-payments',
      );
      imageUrl = uploaded.url;
    }

    const updated = await this.prisma.quickPaymentLink.update({
      where: { slug },
      data: {
        name: dto.name,
        description: dto.description,
        image: imageUrl,
        price: dto.price,
        showOnWebsite: dto.showOnWebsite, // ✅ NEW
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        description: updated.description,
        image: updated.image,
        price: Number(updated.price),
        isActive: updated.isActive,
        showOnWebsite: updated.showOnWebsite, // ✅ NEW
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

    // Delete image if exists
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
        productPrice: Number(order.productPrice),
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
              name: true,
              slug: true,
              image: true,
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
        productPrice: Number(order.productPrice),
        status: order.status,
        linkName: order.link?.name ?? order.productName,
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
            name: true,
            slug: true,
            image: true,
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
        productPrice: Number(order.productPrice),
        status: order.status,
        linkName: order.link?.name ?? order.productName,
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
}
