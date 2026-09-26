import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  Transaction,
  TransactionPayload,
  TransactionSummary,
} from "@/src/types/admin/transactions.types";
import { cleanParams } from "./access.service";

export const transactionsApi = {
  list: async (params: ListParams): Promise<Paginated<Transaction>> =>
    (
      await axiosInstance.get<Paginated<Transaction>>("/transactions", {
        params: cleanParams(params),
      })
    ).data,

  summary: async (params: ListParams): Promise<TransactionSummary> =>
    (
      await axiosInstance.get<{ data: TransactionSummary }>(
        "/transactions/summary",
        { params: cleanParams(params) }
      )
    ).data.data,

  get: async (id: string): Promise<Transaction> =>
    (await axiosInstance.get<{ data: Transaction }>(`/transactions/${id}`)).data
      .data,

  create: async (payload: TransactionPayload): Promise<Transaction> =>
    (await axiosInstance.post<{ data: Transaction }>("/transactions", payload))
      .data.data,

  update: async (
    id: string,
    payload: TransactionPayload
  ): Promise<Transaction> =>
    (
      await axiosInstance.put<{ data: Transaction }>(
        `/transactions/${id}`,
        payload
      )
    ).data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/transactions/${id}`);
  },
};
