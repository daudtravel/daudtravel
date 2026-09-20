"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { transactionsApi } from "@/src/services/admin/transactions.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { TransactionPayload } from "@/src/types/admin/transactions.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const transactionKeys = {
  all: ["admin", "transactions"] as const,
  list: (params: ListParams) =>
    ["admin", "transactions", "list", params] as const,
  summary: (params: ListParams) =>
    ["admin", "transactions", "summary", params] as const,
};

export const useTransactions = (params: ListParams) =>
  useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useTransactionSummary = (params: ListParams) =>
  useQuery({
    queryKey: transactionKeys.summary(params),
    queryFn: () => transactionsApi.summary(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export function useSaveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: string;
      payload: TransactionPayload;
    }) =>
      id
        ? transactionsApi.update(id, payload)
        : transactionsApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
