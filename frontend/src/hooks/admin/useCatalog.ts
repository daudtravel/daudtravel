"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { catalogApi } from "@/src/services/admin/catalog.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { CatalogPayload } from "@/src/types/admin/catalog.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const catalogKeys = {
  all: ["admin", "catalog"] as const,
  list: (params: ListParams) => ["admin", "catalog", "list", params] as const,
  options: ["admin", "catalog", "options"] as const,
  filterOptions: ["admin", "catalog", "filter-options"] as const,
};

export const useCatalog = (params: ListParams) =>
  useQuery({
    queryKey: catalogKeys.list(params),
    queryFn: () => catalogApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useCatalogOptions = (enabled = true) =>
  useQuery({
    queryKey: catalogKeys.options,
    queryFn: catalogApi.options,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export const useCatalogFilterOptions = (enabled = true) =>
  useQuery({
    queryKey: catalogKeys.filterOptions,
    queryFn: catalogApi.filterOptions,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export function useSaveCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: CatalogPayload }) =>
      id ? catalogApi.update(id, payload) : catalogApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  });
}
