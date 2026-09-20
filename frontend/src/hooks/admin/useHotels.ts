"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { hotelsApi } from "@/src/services/admin/hotels.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { HotelPayload } from "@/src/types/admin/hotels.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const hotelKeys = {
  all: ["admin", "hotels"] as const,
  list: (params: ListParams) => ["admin", "hotels", "list", params] as const,
  options: ["admin", "hotels", "options"] as const,
  filterOptions: ["admin", "hotels", "filter-options"] as const,
  detail: (id: string) => ["admin", "hotels", "detail", id] as const,
};

export const useHotels = (params: ListParams) =>
  useQuery({
    queryKey: hotelKeys.list(params),
    queryFn: () => hotelsApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useHotel = (id: string, enabled = true) =>
  useQuery({
    queryKey: hotelKeys.detail(id),
    queryFn: () => hotelsApi.get(id),
    enabled: enabled && !!id,
    retry: adminRetry,
  });

export const useHotelOptions = (enabled = true) =>
  useQuery({
    queryKey: hotelKeys.options,
    queryFn: hotelsApi.options,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export const useHotelFilterOptions = (enabled = true) =>
  useQuery({
    queryKey: hotelKeys.filterOptions,
    queryFn: hotelsApi.filterOptions,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export function useSaveHotel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: HotelPayload }) =>
      id ? hotelsApi.update(id, payload) : hotelsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hotelKeys.all }),
  });
}

export function useDeleteHotel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hotelsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hotelKeys.all }),
  });
}
