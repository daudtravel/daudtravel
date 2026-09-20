import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  DriverOption,
  InsuranceSubmissionRow,
  PaymentStatusRow,
  QuickOrderRow,
  TourOrderRow,
  TransferOrderRow,
} from "@/src/types/admin/orders.types";
import { cleanParams } from "./access.service";
import { normalizePaginated } from "./website.service";

const listGetter =
  <T>(url: string) =>
  async (params: ListParams): Promise<Paginated<T>> => {
    const { data } = await axiosInstance.get(url, {
      params: cleanParams(params),
    });
    return normalizePaginated<T>(data, Number(params.limit) || 10);
  };

export const adminTourOrdersApi = {
  list: listGetter<TourOrderRow>("/tours/orders"),
  deleteFailed: async () => {
    const { data } = await axiosInstance.delete("/tours/orders/failed");
    return data;
  },
};

export const adminTransferOrdersApi = {
  list: listGetter<TransferOrderRow>("/transfers/orders"),
  assignDriver: async (orderId: string, driverId: string | null) => {
    const { data } = await axiosInstance.patch(
      `/transfers/orders/${orderId}/driver`,
      { driverId }
    );
    return data;
  },
  deleteFailed: async () => {
    const { data } = await axiosInstance.delete("/transfers/orders/failed");
    return data;
  },
  deleteExpired: async () => {
    const { data } = await axiosInstance.delete("/transfers/orders/expired");
    return data;
  },
};

export const adminQuickOrdersApi = {
  list: listGetter<QuickOrderRow>("/quick-payment/orders"),
  remove: async (orderId: string) => {
    const { data } = await axiosInstance.delete(
      `/quick-payment/orders/${orderId}`
    );
    return data;
  },
};

export const adminInsuranceApi = {
  list: listGetter<InsuranceSubmissionRow>("/insurance/submissions"),
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete(`/insurance/submissions/${id}`);
    return data;
  },
};

export const adminPaymentStatusesApi = {
  list: listGetter<PaymentStatusRow>("/payment-stats/orders"),
};

/** Public driver list, used for the "assign driver" picker. */
export const driverOptionsApi = {
  all: async (): Promise<DriverOption[]> => {
    const { data } = await axiosInstance.get<{ data: DriverOption[] }>(
      "/drivers"
    );
    return data.data ?? [];
  },
};
