"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { bookingsApi } from "@/src/services/admin/bookings.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type {
  BookingPayload,
  BookingStatus,
} from "@/src/types/admin/bookings.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const bookingKeys = {
  all: ["admin", "bookings"] as const,
  list: (params: ListParams) => ["admin", "bookings", "list", params] as const,
  summary: (params: ListParams) =>
    ["admin", "bookings", "summary", params] as const,
  detail: (id: string) => ["admin", "bookings", "detail", id] as const,
  linkedOrders: ["admin", "bookings", "linked-orders"] as const,
};

export const useBookings = (params: ListParams) =>
  useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingsApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useBookingSummary = (params: ListParams) =>
  useQuery({
    queryKey: bookingKeys.summary(params),
    queryFn: () => bookingsApi.summary(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export const useBooking = (id: string, enabled = true) =>
  useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.get(id),
    enabled: enabled && !!id,
    retry: adminRetry,
  });

/** Which website orders already have a booking (for the order lists). */
export const useLinkedOrders = (enabled = true) =>
  useQuery({
    queryKey: bookingKeys.linkedOrders,
    queryFn: bookingsApi.linkedOrders,
    staleTime: 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export function useSaveBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: BookingPayload }) =>
      id ? bookingsApi.update(id, payload) : bookingsApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsApi.changeStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useSupplierPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, paid }: { itemId: string; paid: boolean }) =>
      bookingsApi.setSupplierPaid(itemId, paid),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useCommissionPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commissionId,
      paid,
    }: {
      commissionId: string;
      paid: boolean;
    }) => bookingsApi.setCommissionPaid(commissionId, paid),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}
