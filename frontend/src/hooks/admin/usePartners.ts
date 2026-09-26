"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { partnersApi } from "@/src/services/admin/partners.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { PartnerPayload } from "@/src/types/admin/partners.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const partnerKeys = {
  all: ["admin", "partners"] as const,
  list: (params: ListParams) => ["admin", "partners", "list", params] as const,
  options: ["admin", "partners", "options"] as const,
  detail: (id: string) => ["admin", "partners", "detail", id] as const,
};

export const usePartners = (params: ListParams) =>
  useQuery({
    queryKey: partnerKeys.list(params),
    queryFn: () => partnersApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const usePartnerOptions = (enabled = true) =>
  useQuery({
    queryKey: partnerKeys.options,
    queryFn: partnersApi.options,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export function useSavePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: PartnerPayload }) =>
      id ? partnersApi.update(id, payload) : partnersApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partnerKeys.all }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnersApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partnerKeys.all }),
  });
}
