import { useQuery } from "@tanstack/react-query";
import { paymentStatsService } from "@/src/services/payment-stats.service";

export type PaymentType = "tours" | "transfers" | "quick" | "insurance";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface StatsGroupedRow {
  type: PaymentType;
  month: string; // "YYYY-MM"
  status: PaymentStatus;
  count: number;
  amount: number;
}

export interface StatsFailureReason {
  reason: string;
  type: PaymentType;
  month: string;
  count: number;
  lastAt: string;
}

export interface PaymentStatsData {
  grouped: StatsGroupedRow[];
  failureReasons: StatsFailureReason[];
}

interface PaymentStatsResponse {
  success: boolean;
  data: PaymentStatsData;
}

export interface PaymentOrderItem {
  type: PaymentType;
  customer: string;
  email: string | null;
  amount: number;
  status: PaymentStatus;
  reason: string | null;
  method: string | null;
  externalOrderId: string;
  date: string;
}

interface PaymentOrdersResponse {
  success: boolean;
  data: PaymentOrderItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usePaymentStats = () => {
  return useQuery<PaymentStatsResponse>({
    queryKey: ["payment-stats"],
    queryFn: paymentStatsService.getStats,
    staleTime: 3 * 60 * 1000,
  });
};

export const usePaymentOrders = (
  type?: PaymentType,
  status?: PaymentStatus,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery<PaymentOrdersResponse>({
    queryKey: ["payment-orders", type, status, page, limit],
    queryFn: () =>
      paymentStatsService.getOrders({ type, status, page, limit }),
    staleTime: 60 * 1000,
  });
};
