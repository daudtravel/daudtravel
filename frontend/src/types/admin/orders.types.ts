export type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export const PAYMENT_STATUSES: PaymentStatusValue[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

export interface TourOrderRow {
  id: string;
  tourId: string;
  customerFirstName: string;
  customerLastName: string | null;
  customerEmail: string;
  customerPhone: string;
  peopleAmount: number;
  selectedDate?: string;
  tourName: string;
  tourDurationDays: number;
  tourDurationNights: number;
  startLocation?: string;
  endLocation?: string;
  isFullPayment: boolean;
  totalTourPrice: number;
  amountPaid: number;
  amountRemaining: number | null;
  externalOrderId: string;
  status: PaymentStatusValue;
  paymentMethod: string | null;
  rejectionReason: string | null;
  paidAt?: string;
  createdAt: string;
}

export interface TransferOrderRow {
  id: string;
  transferId: string;
  externalOrderId: string;
  status: PaymentStatusValue;
  paymentAmount: number;
  currency: string;
  paymentMethod: string | null;
  rejectionReason: string | null;
  paidAt?: string;
  refundedAmount: number | null;
  createdAt: string;
  startLocation: string;
  endLocation: string;
  route: string;
  customer: {
    firstName: string;
    lastName: string | null;
    fullName: string;
    email: string;
    phone: string;
  };
  transfer: {
    passengerCount: number;
    date: string;
    time: string;
    vehicleType: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
  } | null;
}

export interface QuickOrderRow {
  id: string;
  externalOrderId: string;
  customerFullName: string;
  customerEmail?: string;
  customerPhone?: string | null;
  productName: string;
  productUnitPrice: number;
  productQuantity: number;
  productTotalPrice: number;
  status: PaymentStatusValue;
  paymentMethod?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  link?: { slug: string; image?: string | null } | null;
}

export interface InsuranceSubmissionRow {
  id: string;
  externalOrderId: string;
  submitterEmail: string;
  peopleCount: number;
  totalAmount: number;
  totalDays: number;
  status: PaymentStatusValue;
  failureReason: string | null;
  paymentMethod: string | null;
  emailSent: boolean;
  paidAt?: string;
  createdAt: string;
  people?: { id: string; fullName: string; phoneNumber: string }[];
}

export interface PaymentStatusRow {
  type: "tours" | "transfers" | "quick" | "insurance";
  customer: string;
  email: string;
  amount: number;
  status: PaymentStatusValue;
  reason: string | null;
  method: string | null;
  externalOrderId: string;
  date: string;
}

export interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
}
