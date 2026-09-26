"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminDriversApi } from "@/src/services/admin/drivers.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { DriverPayload } from "@/src/types/admin/drivers.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const driverKeys = {
  all: ["admin", "drivers"] as const,
  list: (params: ListParams) => ["admin", "drivers", "list", params] as const,
  options: ["admin", "drivers", "options"] as const,
  languages: ["admin", "drivers", "languages"] as const,
  detail: (id: string) => ["admin", "drivers", "detail", id] as const,
  monthly: (id: string, year?: number) =>
    ["admin", "drivers", "monthly", id, year ?? "current"] as const,
};

export const useDrivers = (params: ListParams) =>
  useQuery({
    queryKey: driverKeys.list(params),
    queryFn: () => adminDriversApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useDriver = (id: string, enabled = true) =>
  useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: () => adminDriversApi.get(id),
    enabled: enabled && !!id,
    retry: adminRetry,
  });

export const useDriverOptions = (enabled = true) =>
  useQuery({
    queryKey: driverKeys.options,
    queryFn: adminDriversApi.options,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export const useDriverLanguages = (enabled = true) =>
  useQuery({
    queryKey: driverKeys.languages,
    queryFn: adminDriversApi.languages,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export const useDriverMonthly = (id: string, year?: number, enabled = true) =>
  useQuery({
    queryKey: driverKeys.monthly(id, year),
    queryFn: () => adminDriversApi.monthly(id, year),
    enabled: enabled && !!id,
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export function useSaveDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      photo,
    }: {
      id?: string;
      payload: DriverPayload;
      photo?: File | null;
    }) =>
      id
        ? adminDriversApi.update(id, payload, photo)
        : adminDriversApi.create(payload, photo),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: driverKeys.all }),
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDriversApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: driverKeys.all }),
  });
}

export function useDriverCarPhotos(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: driverKeys.all });

  const add = useMutation({
    mutationFn: (files: File[]) => adminDriversApi.addCarPhotos(id, files),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (url: string) => adminDriversApi.removeCarPhoto(id, url),
    onSuccess: invalidate,
  });

  return { add, remove };
}

export function useDeleteDriverReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => adminDriversApi.deleteReview(reviewId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: driverKeys.all }),
  });
}
