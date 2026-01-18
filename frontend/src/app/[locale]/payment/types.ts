export interface PaymentAmount {
  requested: number;
  transferred: number;
  refunded?: number;
  currency: string;
}

export interface PaymentResponse {
  code: string | null;
  description: string;
  is_successful: boolean;
}

export interface PaymentStatusResponse {
  success: boolean;
  order_id: string;
  external_order_id: string;
  status: string;
  status_description: string;
  payment_response: PaymentResponse;
  amount: PaymentAmount;
  payment_method?: string;
  transaction_id?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  created_at?: string;
  expires_at?: string;
  reject_reason?: string | null;
  message?: string;
  error?: string;
  full_details?: any;
}
