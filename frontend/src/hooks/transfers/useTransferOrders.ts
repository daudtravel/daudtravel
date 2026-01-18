import { useQuery } from "@tanstack/react-query";
import { transferOrdersAPI } from "@/src/services/transfer-orders.service";

export interface TransferOrder {
  id: string;
  externalOrderId: string;
  bogOrderId: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentAmount: number;
  currency: string;
  paymentUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
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
  transferName?: string;
  startLocation?: string;
  endLocation?: string;
  route?: string;
}

const QUERY_KEY = ["admin", "transfer-orders"];

export const useTransferOrders = () => {
  const query = useQuery<TransferOrder[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await transferOrdersAPI.get(1, 100); // Increase limit to get more orders
      // ✅ FIX: Access result.data since backend returns { success, data, pagination }
      return result.data || [];
    },
    staleTime: 3 * 60 * 1000,
  });

  return query;
};
