// Tour Payment Types
export interface PaymentStatusResponse {
  success: boolean | null;
  order_id: string;
  external_order_id: string;
  status: string;
  status_description?: string;
  payment_response?: {
    code?: string;
    description?: string;
    is_successful?: boolean;
  };
  amount?: {
    requested: number;
    transferred: number;
    currency: string;
  };
  payment_method?: string;
  transaction_id?: string;
  reject_reason?: string;
  message?: string;
  paid_at?: string;
  failed_at?: string;
}

// Quick Payment Types
export interface QuickPaymentDetails {
  id: string;
  status: "PAID" | "PENDING" | "FAILED";
  customerFullName: string;
  productName: string;
  productDescription?: string;
  productUnitPrice: number;
  productQuantity: number;
  productTotalPrice: number;
  productLocale: string;
  paidAt?: string;
  createdAt: string;
}

// Transfer Payment Types (same structure as tour payments)
export type TransferPaymentStatusResponse = PaymentStatusResponse;

// Insurance Payment Types
export interface InsurancePaymentDetails {
  id: string;
  externalOrderId: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  submitterEmail: string;
  peopleCount: number;
  totalAmount: number;
  pricePerPerson: number;
  people: Array<{
    fullName: string;
    phoneNumber: string;
  }>;
  paidAt?: string;
  createdAt: string;
}
