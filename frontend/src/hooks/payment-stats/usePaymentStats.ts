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

export interface StatsRecentFailure {
  type: PaymentType;
  customer: string;
  amount: number;
  reason: string;
  method: string | null;
  date: string;
}

export interface PaymentStatsData {
  grouped: StatsGroupedRow[];
  failureReasons: StatsFailureReason[];
  recentFailures: StatsRecentFailure[];
}

interface PaymentStatsResponse {
  success: boolean;
  data: PaymentStatsData;
}

export const usePaymentStats = () => {
  return useQuery<PaymentStatsResponse>({
    queryKey: ["payment-stats"],
    queryFn: paymentStatsService.getStats,
    staleTime: 3 * 60 * 1000,
  });
};
