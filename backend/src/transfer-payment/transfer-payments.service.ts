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
  getTransfersCallbackUrl,
  verifyBOGSignature,
} from '@/common/utils/bog-payments';
import { MailService } from '@/mail/mail.service';
import { Prisma, PaymentStatus, VehicleType } from '@prisma/client';

interface TransferBookingData {
  transferId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengerCount: number;
  transferDate: Date;
  transferTime: Date;
  vehicleType: VehicleType;
  paymentAmount: number;
  locale?: string;
}

@Injectable()
export class TransferPaymentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async getTransferInLanguage(
    transferId: string,
    locale: string = 'ka',
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        localizations: {
          where: { locale },
        },
        vehicleTypes: true,
      },
    });

    if (!transfer || transfer.localizations.length === 0) {
      // Fallback to first available localization
      const fallbackTransfer = await this.prisma.transfer.findUnique({
        where: { id: transferId },
        include: {
          localizations: true,
          vehicleTypes: true,
        },
      });

      if (!fallbackTransfer || fallbackTransfer.localizations.length === 0) {
        throw new NotFoundException('Transfer not found');
      }

      return {
        transfer: fallbackTransfer,
        localization: fallbackTransfer.localizations[0],
      };
    }

    return {
      transfer,
      localization: transfer.localizations[0],
    };
  }

  async createPayment(bookingData: TransferBookingData) {
    const {
      transferId,
      paymentAmount,
      firstName,
      lastName,
      email,
      phone,
      passengerCount,
      transferDate,
      transferTime,
      vehicleType,
      locale = 'ka',
    } = bookingData;

    // Comprehensive validation
    if (!transferId) {
      throw new BadRequestException('Transfer ID is required');
    }

    if (!paymentAmount || paymentAmount <= 0) {
      throw new BadRequestException(
        'Payment amount is required and must be positive',
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      throw new BadRequestException(
        'Customer information (firstName, lastName, email, phone) is required',
      );
    }

    if (!passengerCount || passengerCount <= 0) {
      throw new BadRequestException(
        'Passenger count is required and must be positive',
      );
    }

    if (!transferDate || !transferTime) {
      throw new BadRequestException('Transfer date and time are required');
    }

    if (!vehicleType) {
      throw new BadRequestException('Vehicle type is required');
    }

    // Get transfer data with localization
    const { transfer, localization } = await this.getTransferInLanguage(
      transferId,
      locale,
    );

    // Validate vehicle type exists for this transfer
    const selectedVehicle = transfer.vehicleTypes.find(
      (vt) => vt.type === vehicleType,
    );

    if (!selectedVehicle) {
      throw new BadRequestException(
        `Vehicle type ${vehicleType} is not available for this transfer`,
      );
    }

    // Validate passenger count doesn't exceed vehicle capacity
    if (passengerCount > selectedVehicle.maxPersons) {
      throw new BadRequestException(
        `Passenger count (${passengerCount}) exceeds vehicle capacity (${selectedVehicle.maxPersons})`,
      );
    }

    const external_order_id = `TRANSFER_ORDER_${uuidv4()}`;
    const accessToken = await getBOGAccessToken();

    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    const bogOrderRequest = {
      callback_url: getTransfersCallbackUrl(),
      external_order_id,
      purchase_units: {
        currency: 'GEL',
        total_amount: paymentAmount,
        basket: [
          {
            product_id: `TRANSFER_${transferId}`,
            description: `${localization.startLocation} → ${localization.endLocation} (${vehicleType})`,
            quantity: passengerCount,
            unit_price: Math.round(paymentAmount / passengerCount),
            total_price: paymentAmount,
          },
        ],
      },
      redirect_urls: {
        success: `${frontendUrl}/transfer/payment/success?order_id=${external_order_id}`,
        fail: `${frontendUrl}/transfer/payment/failure?order_id=${external_order_id}`,
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
        'Accept-Language': locale === 'en' ? 'en' : 'ka',
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

    // Save order to database with transfer locale and details
    const order = await this.prisma.transferPaymentOrder.create({
      data: {
        transferId,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: email,
        customerPhone: phone,
        passengerCount,
        transferDate: new Date(transferDate),
        transferTime: new Date(transferTime),
        vehicleType,
        paymentAmount,
        externalOrderId: external_order_id,
        bogOrderId,
        status: PaymentStatus.PENDING,
        paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes

        transferLocale: locale,
        transferStartLocation: localization.startLocation,
        transferEndLocation: localization.endLocation,
      },
    });

    return {
      success: true,
      orderId: order.id,
      bogOrderId,
      externalOrderId: external_order_id,
      paymentUrl,
      amount: Number(paymentAmount),
      currency: 'GEL',
      status: 'pending',
      expiresInMinutes: 30,
      createdAt: order.createdAt.toISOString(),
      booking: {
        transferId,
        customerName: `${firstName} ${lastName}`,
        passengerCount,
        transferDate: new Date(transferDate).toISOString(),
        transferTime: new Date(transferTime).toISOString(),
        vehicleType,
        vehicleMaxPersons: selectedVehicle.maxPersons,
        route: `${localization.startLocation} → ${localization.endLocation}`,
        locale,
      },
    };
  }

  async handleBOGCallback(rawBody: string, signature: string) {
    // Verify signature
    if (!signature || !verifyBOGSignature(rawBody, signature)) {
      console.error('❌ Invalid BOG callback signature');
      throw new BadRequestException('Invalid signature');
    }

    let callbackData: any;
    try {
      callbackData = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid JSON in callback data');
    }

    if (callbackData.event !== 'order_payment') {
      throw new BadRequestException(
        `Invalid event type: ${callbackData.event}`,
      );
    }

    const orderData = callbackData.body;
    if (!orderData?.order_id) {
      throw new BadRequestException('Missing order_id in callback data');
    }

    const statusKey = (orderData.order_status?.key || '').toLowerCase();
    const transactionId = orderData.payment_detail?.transaction_id || null;
    const paymentMethod =
      orderData.payment_detail?.transfer_method?.key || 'card';
    const rejectReason = orderData.reject_reason;
    const paymentCodeDesc = orderData.payment_detail?.code_description || '';
    const paymentCode = orderData.payment_detail?.code
      ? String(orderData.payment_detail.code)
      : null;
    const refundAmount = Number(orderData.purchase_units?.refund_amount || 0);

    // Determine final status
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

      // Update order
      const updatedOrders = await this.prisma.transferPaymentOrder.updateMany({
        where: {
          OR: [
            { bogOrderId: orderData.order_id },
            { externalOrderId: orderData.external_order_id },
          ],
        },
        data: updateData,
      });

      if (!updatedOrders.count) {
        console.error(
          `❌ Order not found for BOG callback: ${orderData.order_id}`,
        );
        throw new Error('Order not found for update');
      }

      // Fetch updated order
      const order = await this.prisma.transferPaymentOrder.findFirst({
        where: {
          OR: [
            { bogOrderId: orderData.order_id },
            { externalOrderId: orderData.external_order_id },
          ],
        },
        include: {
          transfer: {
            include: {
              localizations: true,
            },
          },
        },
      });

      // Send success email
      if (shouldSendEmail && order && order.customerEmail) {
        try {
          await this.mailService.sendTransferPaymentSuccessEmail({
            firstName: order.customerFirstName,
            lastName: order.customerLastName || '',
            email: order.customerEmail,
            detailsLink: `${process.env.FRONTEND_URL}/transfer/order/${order.id}`,
          });
        } catch (emailError) {
          console.error('❌ Failed to send success email:', emailError);
          // Don't throw - email failure shouldn't fail the callback
        }
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
      console.error('❌ Failed to process BOG callback:', error);
      throw new InternalServerErrorException('Failed to update payment order');
    }
  }

  async getReceiptStatus(orderId: string) {
    let bogOrderId = orderId;
    const isExternalOrderId = orderId.startsWith('TRANSFER_ORDER_');

    const whereClause = isExternalOrderId
      ? { externalOrderId: orderId }
      : { bogOrderId: orderId };

    const dbOrder = await this.prisma.transferPaymentOrder
      .findUnique({
        where: whereClause,
        include: {
          transfer: {
            include: {
              localizations: true,
            },
          },
        },
      })
      .catch(() => null);

    if (dbOrder) {
      bogOrderId = dbOrder.bogOrderId;

      const isExpired = dbOrder.expiresAt && new Date() > dbOrder.expiresAt;
      const isDefinitiveStatus =
        dbOrder.status === PaymentStatus.PAID ||
        dbOrder.status === PaymentStatus.FAILED ||
        dbOrder.status === PaymentStatus.REFUNDED;

      // Return cached status if definitive
      if (isDefinitiveStatus) {
        const isSuccessful = dbOrder.status === PaymentStatus.PAID;

        return {
          success: isSuccessful,
          order_id: bogOrderId,
          external_order_id: dbOrder.externalOrderId,
          status: dbOrder.status,
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
            requested: parseFloat(dbOrder.paymentAmount.toString() || '0'),
            transferred: isSuccessful
              ? parseFloat(dbOrder.paymentAmount.toString() || '0')
              : 0,
            refunded: dbOrder.refundedAmount
              ? parseFloat(dbOrder.refundedAmount.toString())
              : 0,
            currency: 'GEL',
          },
          payment_method: dbOrder.paymentMethod || 'card',
          transaction_id: dbOrder.transactionId,
          paid_at: dbOrder.paidAt,
          failed_at: dbOrder.failedAt,
          refunded_at: dbOrder.refundedAt,
          full_details: dbOrder.callbackData,
        };
      }

      // Handle expired pending orders
      if (isExpired && dbOrder.status === PaymentStatus.PENDING) {
        const updatedOrder = await this.prisma.transferPaymentOrder.update({
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
            requested: parseFloat(updatedOrder.paymentAmount.toString() || '0'),
            transferred: 0,
            currency: 'GEL',
          },
          message: 'Payment session expired. Please create a new payment.',
        };
      }
    } else if (isExternalOrderId) {
      throw new NotFoundException('Order not found in database');
    }

    // Fetch from BOG API for pending/unknown orders
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
                const updatedOrder =
                  await this.prisma.transferPaymentOrder.update({
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
                      updatedOrder.paymentAmount.toString() || '0',
                    ),
                    transferred: 0,
                    currency: 'GEL',
                  },
                  message:
                    'Payment session expired. Please create a new payment.',
                };
              }

              // Still pending, not expired
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
                  requested: parseFloat(
                    dbOrder.paymentAmount.toString() || '0',
                  ),
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
      const statusKey = (receipt.order_status?.key || '').toLowerCase();
      const isSuccessful =
        statusKey === 'completed' || statusKey === 'partial_completed';
      const isFailed = statusKey === 'rejected' || statusKey === 'failed';

      // Sync database with BOG receipt
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

        await this.prisma.transferPaymentOrder.update({
          where: { id: dbOrder.id },
          data: updateData,
        });

        // Send success email if newly paid
        if (newStatus === PaymentStatus.PAID && dbOrder.customerEmail) {
          try {
            await this.mailService.sendTransferPaymentSuccessEmail({
              firstName: dbOrder.customerFirstName,
              lastName: dbOrder.customerLastName || '',
              email: dbOrder.customerEmail,
              detailsLink: `${process.env.FRONTEND_URL}/transfer/order/${dbOrder.id}`,
            });
          } catch (emailError) {
            console.error('❌ Failed to send success email:', emailError);
          }
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
            const updatedOrder = await this.prisma.transferPaymentOrder.update({
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

  async getOrders(page: number = 1, limit: number = 10, status?: string) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(100, limit));
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (
      status &&
      Object.values(PaymentStatus).includes(status as PaymentStatus)
    ) {
      whereClause.status = status as PaymentStatus;
    }

    const [orders, totalRecords] = await Promise.all([
      this.prisma.transferPaymentOrder.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          transfer: {
            include: {
              localizations: true,
            },
          },
        },
      }),
      this.prisma.transferPaymentOrder.count({ where: whereClause }),
    ]);

    const formattedOrders = orders.map((order) => this.formatOrder(order));

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
      filters: {
        status: status || null,
      },
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.transferPaymentOrder.findUnique({
      where: { id },
      include: {
        transfer: {
          include: {
            localizations: true,
            vehicleTypes: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Transfer order not found');
    }

    return {
      success: true,
      data: this.formatOrder(order),
    };
  }

  async deleteFailedOrders() {
    const failedOrders = await this.prisma.transferPaymentOrder.findMany({
      where: { status: PaymentStatus.FAILED },
      orderBy: { createdAt: 'desc' },
    });

    if (failedOrders.length === 0) {
      return {
        success: true,
        message: 'No failed transfer orders found to delete',
        deletedCount: 0,
        deletedOrders: [],
      };
    }

    await this.prisma.transferPaymentOrder.deleteMany({
      where: { status: PaymentStatus.FAILED },
    });

    return {
      success: true,
      message: `Successfully deleted ${failedOrders.length} failed transfer payment orders`,
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

  async deleteExpiredOrders() {
    const now = new Date();
    const expiredOrders = await this.prisma.transferPaymentOrder.findMany({
      where: {
        status: PaymentStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (expiredOrders.length === 0) {
      return {
        success: true,
        message: 'No expired transfer orders found to delete',
        deletedCount: 0,
        deletedOrders: [],
      };
    }

    await this.prisma.transferPaymentOrder.deleteMany({
      where: {
        status: PaymentStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
    });

    return {
      success: true,
      message: `Successfully deleted ${expiredOrders.length} expired transfer payment orders`,
      deletedCount: expiredOrders.length,
      deletedOrders: expiredOrders.map((order) => ({
        id: order.id,
        external_order_id: order.externalOrderId,
        customer_email: order.customerEmail,
        created_at: order.createdAt,
        expires_at: order.expiresAt,
      })),
    };
  }

  async cleanupOrders() {
    const now = new Date();

    const [failedOrders, expiredOrders] = await Promise.all([
      this.prisma.transferPaymentOrder.findMany({
        where: { status: PaymentStatus.FAILED },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transferPaymentOrder.findMany({
        where: {
          status: PaymentStatus.PENDING,
          expiresAt: {
            lt: now,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const allOrdersToDelete = [...failedOrders, ...expiredOrders];

    if (allOrdersToDelete.length === 0) {
      return {
        success: true,
        message: 'No failed or expired transfer orders found to delete',
        deletedCount: 0,
        deletedOrders: [],
      };
    }

    const [deletedFailed, deletedExpired] = await Promise.all([
      this.prisma.transferPaymentOrder.deleteMany({
        where: { status: PaymentStatus.FAILED },
      }),
      this.prisma.transferPaymentOrder.deleteMany({
        where: {
          status: PaymentStatus.PENDING,
          expiresAt: {
            lt: now,
          },
        },
      }),
    ]);

    const totalDeletedCount = deletedFailed.count + deletedExpired.count;

    return {
      success: true,
      message: `Successfully deleted ${totalDeletedCount} transfer orders (${deletedFailed.count} failed, ${deletedExpired.count} expired)`,
      deletedCount: totalDeletedCount,
      deletedOrders: allOrdersToDelete.map((order) => ({
        id: order.id,
        external_order_id: order.externalOrderId,
        customer_email: order.customerEmail,
        created_at: order.createdAt,
        rejection_reason: order.rejectionReason || 'Order expired',
      })),
    };
  }

  private formatOrder(order: any) {
    const localization =
      order.transfer?.localizations?.find(
        (loc: any) => loc.locale === order.transferLocale,
      ) || order.transfer?.localizations?.[0];

    return {
      id: order.id,
      transferId: order.transferId,
      externalOrderId: order.externalOrderId,
      bogOrderId: order.bogOrderId,
      status: order.status,
      paymentAmount: Number(order.paymentAmount),
      currency: 'GEL',
      paymentUrl: order.paymentUrl,
      transactionId: order.transactionId,
      paymentMethod: order.paymentMethod,
      rejectionReason: order.rejectionReason,
      expiresAt: order.expiresAt?.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      failedAt: order.failedAt?.toISOString(),
      refundedAt: order.refundedAt?.toISOString(),
      refundedAmount: order.refundedAmount
        ? Number(order.refundedAmount)
        : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),

      startLocation:
        order.transferStartLocation || localization?.startLocation || 'Unknown',
      endLocation:
        order.transferEndLocation || localization?.endLocation || 'Unknown',
      route: `${order.transferStartLocation || localization?.startLocation || 'Unknown'} → ${order.transferEndLocation || localization?.endLocation || 'Unknown'}`,
      transferName:
        localization?.name ||
        `${order.transferStartLocation || 'Airport'} Transfer`,

      customer: {
        firstName: order.customerFirstName,
        lastName: order.customerLastName,
        fullName:
          `${order.customerFirstName} ${order.customerLastName || ''}`.trim(),
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      transfer: {
        passengerCount: order.passengerCount,
        date: order.transferDate.toISOString(),
        time: order.transferTime.toISOString(),
        vehicleType: order.vehicleType,
      },
    };
  }
}
