import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { getBOGAccessToken } from '@/common/utils/bog-auth';
import {
  BOG_API_URL,
  getTourPaymentsCallbackUrl,
  verifyBOGSignature,
} from '@/common/utils/bog-payments';
import { MailService } from '@/mail/mail.service';
import { Prisma, PaymentStatus } from '@prisma/client';
import { getPrimaryFrontendUrl } from '@/common/utils/frontend-url.util';

interface TourBookingData {
  tourId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  peopleAmount: number;
  selectedDate: Date;
  tourDurationDays?: number;
  tourDurationNights?: number;
  paymentType: boolean;
  paymentAmount: number;
  totalTourPrice: number;
  remainingAmount?: number;
  tourName: string;
  tourDescription?: string;
  startLocation?: string;
  endLocation?: string;
  locations?: string[];
  locale?: string;
}

@Injectable()
export class TourPaymentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private extractPlainText(description: string | undefined): string | null {
    if (!description) return null;

    try {
      const parsed = JSON.parse(description);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return (
          parsed.blocks
            .map((block: any) => block.text || '')
            .filter((text: string) => text.trim())
            .join(' ')
            .trim() || null
        );
      }
      return description.trim() || null;
    } catch {
      return description.trim() || null;
    }
  }

  private async getTourInLanguage(tourId: string, locale: string = 'ka') {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        localizations: {
          where: { locale },
        },
      },
    });

    if (!tour || tour.localizations.length === 0) {
      const fallbackTour = await this.prisma.tour.findUnique({
        where: { id: tourId },
        include: {
          localizations: true,
        },
      });

      if (!fallbackTour || fallbackTour.localizations.length === 0) {
        throw new NotFoundException('Tour not found');
      }

      return {
        tour: fallbackTour,
        localization: fallbackTour.localizations[0],
      };
    }

    return {
      tour,
      localization: tour.localizations[0],
    };
  }

  async createPayment(bookingData: TourBookingData) {
    const {
      tourId,
      paymentAmount,
      totalTourPrice,
      firstName,
      lastName,
      email,
      phone,
      peopleAmount,
      selectedDate,
      paymentType,
      remainingAmount,
      locale = 'ka',
    } = bookingData;

    if (!tourId) {
      throw new BadRequestException('Tour ID is required');
    }

    if (!paymentAmount || paymentAmount <= 0) {
      throw new BadRequestException(
        'Payment amount is required and must be positive',
      );
    }

    if (!totalTourPrice || totalTourPrice <= 0) {
      throw new BadRequestException(
        'Total tour price is required and must be positive',
      );
    }

    if (paymentAmount > totalTourPrice) {
      throw new BadRequestException(
        'Payment amount cannot exceed total tour price',
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      throw new BadRequestException(
        'Customer information (firstName, lastName, email, phone) is required',
      );
    }

    if (!peopleAmount || !selectedDate) {
      throw new BadRequestException(
        'Tour information (peopleAmount, selectedDate) is required',
      );
    }

    if (!paymentType && (!remainingAmount || remainingAmount <= 0)) {
      throw new BadRequestException(
        'Remaining amount is required for reservation payments',
      );
    }

    const { tour, localization } = await this.getTourInLanguage(tourId, locale);

    const external_order_id = `TOUR_ORDER_${uuidv4()}`;
    const accessToken = await getBOGAccessToken();

    const frontendUrl = getPrimaryFrontendUrl();

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    const bogOrderRequest = {
      callback_url: getTourPaymentsCallbackUrl(),
      external_order_id,
      purchase_units: {
        currency: 'GEL',
        total_amount: paymentAmount,
        basket: [
          {
            product_id: `TOUR_${tourId}`,
            description: localization.name,
            quantity: peopleAmount,
            unit_price: Math.round(paymentAmount / peopleAmount),
            total_price: paymentAmount,
          },
        ],
      },
      redirect_urls: {
        success: `${frontendUrl}/payment/success?order_id=${external_order_id}`,
        fail: `${frontendUrl}/payment/failure?order_id=${external_order_id}`,
      },
      buyer: {
        full_name: `${firstName} ${lastName}`,
        masked_email: email,
        masked_phone: phone,
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      console.error('❌ BOG API Error:', JSON.stringify(errorData, null, 2));
      throw new InternalServerErrorException(
        `BOG API error: ${bogResponse.statusText}`,
      );
    }

    const bogOrderData = await bogResponse.json();
    const bogOrderId = bogOrderData.id;
    const paymentUrl = bogOrderData._links.redirect.href;

    const calculatedRemainingAmount = paymentType
      ? null
      : totalTourPrice - paymentAmount;

    const cleanDescription = this.extractPlainText(localization.description);
    const locations = localization.locations || [];
    const endLocation =
      locations.length > 0
        ? locations[locations.length - 1]
        : localization.startLocation;

    const order = await this.prisma.tourPaymentOrder.create({
      data: {
        tourId,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: email,
        customerPhone: phone,
        peopleCount: peopleAmount,
        selectedDate: new Date(selectedDate),
        isFullPayment: paymentType,
        totalPrice: totalTourPrice,
        paidAmount: paymentAmount,
        remainingAmount: calculatedRemainingAmount,
        externalOrderId: external_order_id,
        bogOrderId,
        status: PaymentStatus.PENDING,
        paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        tourLocale: locale,
        tourName: localization.name,
        tourDescription: cleanDescription,
        tourDurationDays: tour.days,
        tourDurationNights: tour.nights,
        startLocation: localization.startLocation,
        endLocation: endLocation,
        locations: locations,
      },
    });

    return {
      success: true,
      orderId: order.id,
      bogOrderId,
      externalOrderId: external_order_id,
      paymentUrl,
      amount: Number(paymentAmount),
      totalTourPrice: Number(totalTourPrice),
      remainingAmount: calculatedRemainingAmount
        ? Number(calculatedRemainingAmount)
        : null,
      currency: 'GEL',
      status: 'pending',
      expiresInMinutes: 30,
      createdAt: order.createdAt.toISOString(),
    };
  }

  // tour-payments.service.ts - Update handleBOGCallback

  async handleBOGCallback(rawBody: string, signature: string) {
    if (!signature || !verifyBOGSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    let callbackData: any;
    try {
      callbackData = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid JSON in callback data');
    }

    if (callbackData.event !== 'order_payment') {
      throw new BadRequestException('Invalid event type');
    }

    const orderData = callbackData.body;
    if (!orderData?.order_id) {
      throw new BadRequestException('Missing order_id');
    }

    const statusKey = (orderData.order_status?.key || '').toLowerCase();
    const transactionId = orderData.payment_detail?.transaction_id || null;
    const paymentMethod =
      orderData.payment_detail?.transfer_method?.key || 'card';
    const requestAmount = Number(orderData.purchase_units?.request_amount || 0);
    const refundAmount = Number(orderData.purchase_units?.refund_amount || 0);
    const rejectReason = orderData.reject_reason;
    const paymentCodeDesc = orderData.payment_detail?.code_description || '';
    const paymentCode = orderData.payment_detail?.code
      ? String(orderData.payment_detail.code)
      : null;

    let finalStatus: PaymentStatus = PaymentStatus.PENDING;
    let shouldSendEmail = false;

    if (statusKey === 'completed' || statusKey === 'partial_completed') {
      finalStatus = PaymentStatus.PAID;
      shouldSendEmail = true;
    } else if (statusKey === 'rejected' || statusKey === 'failed') {
      finalStatus = PaymentStatus.FAILED;
    } else if (statusKey === 'refunded' || statusKey === 'refunded_partially') {
      finalStatus = PaymentStatus.REFUNDED;
    }

    try {
      const updateData: any = {
        status: finalStatus,
        callbackData: orderData as Prisma.InputJsonValue,
        updatedAt: new Date(),
      };

      if (finalStatus === PaymentStatus.PAID) {
        updateData.transactionId = transactionId;
        updateData.paymentMethod = paymentMethod;
        updateData.paidAmount = requestAmount;
        updateData.paidAt = new Date();
        updateData.failedAt = null;
        updateData.rejectionReason = null;
      }

      if (finalStatus === PaymentStatus.FAILED) {
        updateData.failedAt = new Date();
        updateData.rejectionReason =
          rejectReason ||
          paymentCodeDesc ||
          (paymentCode
            ? `Payment failed (code: ${paymentCode})`
            : 'Payment failed');
        updateData.paidAt = null;
      }

      if (finalStatus === PaymentStatus.REFUNDED) {
        updateData.refundedAt = new Date();
        updateData.refundedAmount = refundAmount;
      }

      const updatedOrders = await this.prisma.tourPaymentOrder.updateMany({
        where: {
          OR: [
            { bogOrderId: orderData.order_id },
            { externalOrderId: orderData.external_order_id },
          ],
        },
        data: updateData,
      });

      if (!updatedOrders.count) {
        throw new Error('Order not found for update');
      }

      const order = await this.prisma.tourPaymentOrder.findFirst({
        where: {
          OR: [
            { bogOrderId: orderData.order_id },
            { externalOrderId: orderData.external_order_id },
          ],
        },
      });

      const frontendUrl = getPrimaryFrontendUrl();

      if (!frontendUrl) {
        throw new InternalServerErrorException(
          'FRONTEND_URL environment variable is not configured',
        );
      }

      if (shouldSendEmail && order && order.customerEmail) {
        await this.mailService.sendPaymentSuccessEmail({
          firstName: order.customerFirstName,
          lastName: order.customerLastName || '',
          email: order.customerEmail,
          detailsLink: `${frontendUrl}/tours/order/${order.id}`,
        });
      }

      return {
        success: true,
        order_id: orderData.order_id,
        external_order_id: order?.externalOrderId,
        status: finalStatus,
        is_successful: finalStatus === PaymentStatus.PAID,
        processed_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to update payment order');
    }
  }

  async getReceiptStatus(orderId: string) {
    let bogOrderId = orderId;
    const isExternalOrderId = orderId.startsWith('TOUR_ORDER_');

    const whereClause = isExternalOrderId
      ? { externalOrderId: orderId }
      : { bogOrderId: orderId };

    const dbOrder = await this.prisma.tourPaymentOrder
      .findUnique({
        where: whereClause,
      })
      .catch(() => null);

    if (dbOrder) {
      bogOrderId = dbOrder.bogOrderId;

      const isExpired = dbOrder.expiresAt && new Date() > dbOrder.expiresAt;
      const isDefinitiveStatus =
        dbOrder.status === PaymentStatus.PAID ||
        dbOrder.status === PaymentStatus.FAILED ||
        dbOrder.status === PaymentStatus.REFUNDED;

      // ✅ Return DB status if it's definitive
      if (isDefinitiveStatus) {
        const isSuccessful = dbOrder.status === PaymentStatus.PAID;

        return {
          success: isSuccessful,
          order_id: bogOrderId,
          external_order_id: dbOrder.externalOrderId,
          status: dbOrder.status, // ✅ Use enum value directly
          status_description: isSuccessful
            ? 'Payment completed successfully'
            : dbOrder.rejectionReason || 'Payment failed',
          payment_response: {
            code: isSuccessful ? '100' : null,
            description:
              dbOrder.rejectionReason ||
              (isSuccessful ? 'Transaction approved' : 'Payment failed'),
            is_successful: isSuccessful,
          },
          amount: {
            requested: parseFloat(dbOrder.paidAmount.toString() || '0'),
            transferred: isSuccessful
              ? parseFloat(dbOrder.paidAmount.toString() || '0')
              : 0,
            currency: 'GEL',
          },
          payment_method: dbOrder.paymentMethod || 'card',
          transaction_id: dbOrder.transactionId,
          paid_at: dbOrder.paidAt,
          failed_at: dbOrder.failedAt,
          full_details: dbOrder.callbackData,
        };
      }

      // ✅ Handle expired orders
      if (isExpired && dbOrder.status === PaymentStatus.PENDING) {
        const updatedOrder = await this.prisma.tourPaymentOrder.update({
          where: { id: dbOrder.id },
          data: {
            status: PaymentStatus.FAILED,
            rejectionReason: 'Payment session expired',
            failedAt: new Date(),
          },
        });

        return {
          success: false,
          order_id: bogOrderId,
          external_order_id: updatedOrder.externalOrderId,
          status: PaymentStatus.FAILED, // ✅ Use enum
          status_description: 'Payment session expired',
          payment_response: {
            code: null,
            description: 'Payment session expired before completion',
            is_successful: false,
          },
          amount: {
            requested: parseFloat(updatedOrder.paidAmount.toString() || '0'),
            transferred: 0,
            refunded: 0,
            currency: 'GEL',
          },
          message: 'Payment session expired. Please create a new payment.',
        };
      }
    } else if (isExternalOrderId) {
      throw new NotFoundException('Order not found in database');
    }

    // ✅ Fetch from BOG API
    try {
      const accessToken = await getBOGAccessToken();
      const response = await fetch(`${BOG_API_URL}/receipt/${bogOrderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          if (dbOrder) {
            const isExpired =
              dbOrder.expiresAt && new Date() > dbOrder.expiresAt;

            if (dbOrder.status === PaymentStatus.PENDING) {
              if (isExpired) {
                const updatedOrder = await this.prisma.tourPaymentOrder.update({
                  where: { id: dbOrder.id },
                  data: {
                    status: PaymentStatus.FAILED,
                    rejectionReason: 'Payment session expired',
                    failedAt: new Date(),
                  },
                });

                return {
                  success: false,
                  order_id: bogOrderId,
                  external_order_id: updatedOrder.externalOrderId,
                  status: PaymentStatus.FAILED,
                  status_description: 'Payment session expired',
                  payment_response: {
                    code: null,
                    description: 'Payment session expired before completion',
                    is_successful: false,
                  },
                  amount: {
                    requested: parseFloat(
                      updatedOrder.paidAmount.toString() || '0',
                    ),
                    transferred: 0,
                    currency: 'GEL',
                  },
                  message:
                    'Payment session expired. Please create a new payment.',
                };
              }

              return {
                success: null,
                order_id: bogOrderId,
                external_order_id: dbOrder.externalOrderId,
                status: PaymentStatus.PENDING,
                status_description: 'Payment is being processed',
                payment_response: {
                  code: null,
                  description: 'Waiting for payment confirmation',
                  is_successful: null,
                },
                amount: {
                  requested: parseFloat(dbOrder.paidAmount.toString() || '0'),
                  transferred: 0,
                  currency: 'GEL',
                },
                message:
                  'Payment is being processed. Please wait for confirmation.',
              };
            }

            return {
              success: false,
              order_id: bogOrderId,
              external_order_id: dbOrder.externalOrderId,
              status: dbOrder.status,
              status_description: 'Receipt not found in BOG',
              payment_response: {
                code: null,
                description: 'Payment information not available',
                is_successful: false,
              },
            };
          }

          throw new NotFoundException('Receipt not found in BOG system');
        }

        throw new InternalServerErrorException(
          `BOG API error: ${response.statusText}`,
        );
      }

      const receipt = await response.json();

      // ✅ FIX: Read from order_status.key, not status
      const statusKey = (receipt.order_status?.key || '').toLowerCase();
      const isSuccessful =
        statusKey === 'completed' || statusKey === 'partial_completed';
      const isFailed = statusKey === 'rejected' || statusKey === 'failed';

      // ✅ Update database if we have the order
      if (dbOrder) {
        let newStatus: PaymentStatus;

        if (isSuccessful) {
          newStatus = PaymentStatus.PAID;
        } else if (isFailed) {
          newStatus = PaymentStatus.FAILED;
        } else if (
          statusKey === 'refunded' ||
          statusKey === 'refunded_partially'
        ) {
          newStatus = PaymentStatus.REFUNDED;
        } else {
          newStatus = PaymentStatus.PENDING;
        }

        const updateData: any = {
          status: newStatus,
          callbackData: receipt as Prisma.InputJsonValue,
          updatedAt: new Date(),
        };

        if (newStatus === PaymentStatus.PAID) {
          updateData.transactionId = receipt.payment_detail?.transaction_id;
          updateData.paymentMethod =
            receipt.payment_detail?.transfer_method?.key || 'card';
          updateData.paidAmount = parseFloat(
            receipt.purchase_units.request_amount || '0',
          );
          updateData.paidAt = new Date();
          updateData.failedAt = null;
          updateData.rejectionReason = null;
        } else if (newStatus === PaymentStatus.FAILED) {
          updateData.rejectionReason =
            receipt.payment_detail?.code_description ||
            receipt.reject_reason ||
            'Payment failed';
          updateData.failedAt = new Date();
          updateData.paidAt = null;
        } else if (newStatus === PaymentStatus.REFUNDED) {
          updateData.refundedAt = new Date();
          updateData.refundedAmount = parseFloat(
            receipt.purchase_units.refund_amount || '0',
          );
        }

        await this.prisma.tourPaymentOrder.update({
          where: { id: dbOrder.id },
          data: updateData,
        });

        const frontendUrl = getPrimaryFrontendUrl();

        if (!frontendUrl) {
          throw new InternalServerErrorException(
            'FRONTEND_URL environment variable is not configured',
          );
        }

        if (newStatus === PaymentStatus.PAID && dbOrder.customerEmail) {
          await this.mailService.sendPaymentSuccessEmail({
            firstName: dbOrder.customerFirstName,
            lastName: dbOrder.customerLastName || '',
            email: dbOrder.customerEmail,
            detailsLink: `${frontendUrl}/tours/order/${dbOrder.id}`,
          });
        }
      }

      return {
        success: isSuccessful,
        order_id: receipt.order_id,
        external_order_id: receipt.external_order_id,
        status: isSuccessful
          ? PaymentStatus.PAID
          : isFailed
            ? PaymentStatus.FAILED
            : PaymentStatus.PENDING,
        status_description: receipt.order_status.value,
        payment_response: {
          code: receipt.payment_detail?.code,
          description: receipt.payment_detail?.code_description,
          is_successful: isSuccessful,
        },
        amount: {
          requested: parseFloat(receipt.purchase_units.request_amount),
          transferred: parseFloat(
            receipt.purchase_units.transfer_amount || '0',
          ),
          refunded: parseFloat(receipt.purchase_units.refund_amount || '0'),
          currency: receipt.purchase_units.currency_code,
        },
        payment_method: receipt.payment_detail?.transfer_method?.key,
        transaction_id: receipt.payment_detail?.transaction_id,
        card_type: receipt.payment_detail?.card_type,
        payer_identifier: receipt.payment_detail?.payer_identifier,
        created_at: receipt.zoned_create_date,
        expires_at: receipt.zoned_expire_date,
        buyer: receipt.buyer,
        reject_reason: receipt.reject_reason,
        full_details: receipt,
      };
    } catch (error) {
      if (dbOrder) {
        if (dbOrder.status === PaymentStatus.PENDING) {
          const isExpired = dbOrder.expiresAt && new Date() > dbOrder.expiresAt;

          if (isExpired) {
            const updatedOrder = await this.prisma.tourPaymentOrder.update({
              where: { id: dbOrder.id },
              data: {
                status: PaymentStatus.FAILED,
                rejectionReason: 'Payment session expired',
                failedAt: new Date(),
              },
            });

            return {
              success: false,
              order_id: bogOrderId,
              external_order_id: updatedOrder.externalOrderId,
              status: PaymentStatus.FAILED,
              status_description: 'Payment session expired',
              payment_response: {
                code: null,
                description: 'Could not verify payment status with bank',
                is_successful: false,
              },
              message:
                'Payment session expired. Please contact support if money was deducted.',
            };
          }

          return {
            success: null,
            order_id: bogOrderId,
            external_order_id: dbOrder.externalOrderId,
            status: PaymentStatus.PENDING,
            status_description: 'Payment verification in progress',
            payment_response: {
              code: null,
              description: 'Waiting for payment confirmation',
              is_successful: null,
            },
            message: 'Payment is being processed. Please wait.',
          };
        }

        return {
          success: false,
          order_id: bogOrderId,
          external_order_id: dbOrder.externalOrderId,
          status: dbOrder.status,
          status_description: 'Error fetching from BOG',
          payment_response: {
            code: null,
            description: 'Could not verify payment status',
            is_successful: false,
          },
          message: 'Error fetching payment status from BOG',
        };
      }
      throw error;
    }
  }

  async getOrders(page: number = 1, limit: number = 10) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(100, limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalRecords] = await Promise.all([
      this.prisma.tourPaymentOrder.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          tour: {
            include: {
              localizations: true,
            },
          },
        },
      }),
      this.prisma.tourPaymentOrder.count(),
    ]);

    const formattedOrders = orders.map((order) =>
      this.formatOrder(order, false),
    );

    const totalPages = Math.ceil(totalRecords / limitNum);

    return {
      success: true,
      data: formattedOrders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.tourPaymentOrder.findUnique({
      where: { id },
      include: {
        tour: {
          include: {
            localizations: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Tour order not found');
    }

    return {
      success: true,
      data: this.formatOrder(order, true), // ✅ Always mask for public access
    };
  }

  async deleteFailedOrders() {
    const failedOrders = await this.prisma.tourPaymentOrder.findMany({
      where: { status: PaymentStatus.FAILED },
      orderBy: { createdAt: 'desc' },
    });

    if (failedOrders.length === 0) {
      return {
        success: true,
        message: 'No failed tour orders found to delete',
        deletedCount: 0,
        deletedOrders: [],
      };
    }

    await this.prisma.tourPaymentOrder.deleteMany({
      where: { status: PaymentStatus.FAILED },
    });

    return {
      success: true,
      message: `Successfully deleted ${failedOrders.length} failed tour payment orders`,
      deletedCount: failedOrders.length,
      deletedOrders: failedOrders.map((order) => ({
        id: order.id,
        external_order_id: order.externalOrderId,
        customer_email: order.customerEmail,
        created_at: order.createdAt,
        rejection_reason: order.rejectionReason,
      })),
    };
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;

    const [localPart, domain] = email.split('@');

    if (localPart.length <= 3) {
      // Very short emails: show first char only
      return `${localPart[0]}***@${domain}`;
    }

    // Show first 3 chars and last char before @
    const visibleStart = localPart.substring(0, 3);
    const visibleEnd = localPart.charAt(localPart.length - 1);

    return `${visibleStart}***${visibleEnd}@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (!phone) return phone;

    // Remove all non-digit characters for processing
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length <= 4) {
      return phone; // Too short to mask meaningfully
    }

    // For Georgian numbers: +995 555 135 856 -> +995 555 135 ***
    // Show first half, mask second half
    const visibleLength = Math.ceil(digitsOnly.length / 2);
    const maskedLength = digitsOnly.length - visibleLength;

    // Try to preserve original format
    if (phone.startsWith('+')) {
      // International format
      const countryCode = phone.match(/^\+\d{1,3}/)?.[0] || '+995';
      const remainingDigits = digitsOnly.substring(
        countryCode.replace('+', '').length,
      );
      const visiblePart = remainingDigits.substring(0, visibleLength);
      const masked = '***'.repeat(Math.ceil(maskedLength / 3));

      // Format nicely: +995 555 135 ***
      const formatted =
        `${countryCode} ${visiblePart.substring(0, 3)} ${visiblePart.substring(3)} ${masked}`.trim();
      return formatted;
    }

    // Fallback: show first half, mask rest
    const visible = digitsOnly.substring(0, visibleLength);
    const masked = '*'.repeat(maskedLength);

    return `${visible}${masked}`;
  }

  private maskName(firstName: string, lastName?: string): string {
    if (!firstName) return '';

    let maskedFirst = firstName;
    if (firstName.length > 3) {
      // Show first 3 chars: "Lado" -> "Lad***"
      maskedFirst = `${firstName.substring(0, 3)}***`;
    }

    let maskedLast = '';
    if (lastName) {
      if (lastName.length > 3) {
        // Show first 3 chars: "Asambadze" -> "Asa***"
        maskedLast = `${lastName.substring(0, 3)}***`;
      } else {
        maskedLast = lastName;
      }
    }

    return lastName ? `${maskedFirst} ${maskedLast}` : maskedFirst;
  }

  private formatOrder(order: any, maskSensitiveData: boolean = true) {
    return {
      id: order.id,
      tourId: order.tourId,

      // Conditionally mask sensitive data
      customerFirstName: maskSensitiveData
        ? this.maskName(order.customerFirstName, order.customerLastName)
        : `${order.customerFirstName} ${order.customerLastName || ''}`.trim(),
      customerLastName: maskSensitiveData ? null : order.customerLastName, // Hide when masked
      customerEmail: maskSensitiveData
        ? this.maskEmail(order.customerEmail)
        : order.customerEmail,
      customerPhone: maskSensitiveData
        ? this.maskPhone(order.customerPhone)
        : order.customerPhone,

      peopleAmount: order.peopleCount,
      selectedDate: order.selectedDate?.toISOString(),
      tourDurationDays: order.tourDurationDays,
      tourDurationNights: order.tourDurationNights,
      tourName: order.tourName,
      tourDescription: order.tourDescription,
      startLocation: order.startLocation,
      endLocation: order.endLocation,
      locations: order.locations || [],
      isFullPayment: order.isFullPayment,
      totalTourPrice: Number(order.totalPrice),
      amountPaid: Number(order.paidAmount),
      amountRemaining: order.remainingAmount
        ? Number(order.remainingAmount)
        : null,

      externalOrderId: order.externalOrderId,
      bogOrderId: order.bogOrderId,
      status: order.status,
      paymentUrl: order.paymentUrl,
      transactionId: order.transactionId,
      paymentMethod: order.paymentMethod,
      rejectionReason: order.rejectionReason,
      expiresAt: order.expiresAt?.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      failedAt: order.failedAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
