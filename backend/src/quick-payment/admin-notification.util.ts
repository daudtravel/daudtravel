import { QuickPaymentOrder } from '@prisma/client';

/** Where "new quick payment" emails go: ADMIN_EMAIL, else the office Gmail. */
export function quickPaymentAdminEmail(): string {
  return process.env.ADMIN_EMAIL || 'traveldaud@gmail.com';
}

/** A paid order as the admin notification email shows it. */
export function toAdminNotificationOrder(order: QuickPaymentOrder) {
  return {
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
  };
}
