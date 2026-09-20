"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  adminAccommodationsApi,
  adminFaqApi,
  adminPaymentLinksApi,
  adminToursApi,
  adminTransfersApi,
  adminVideosApi,
} from "@/src/services/admin/website.service";
import {
  adminInsuranceApi,
  adminPaymentStatusesApi,
  adminQuickOrdersApi,
  adminTourOrdersApi,
  adminTransferOrdersApi,
  driverOptionsApi,
} from "@/src/services/admin/orders.service";
import type { ListParams } from "@/src/types/admin/common.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const adminKeys = {
  tours: ["admin", "website", "tours"] as const,
  transfers: ["admin", "website", "transfers"] as const,
  accommodations: ["admin", "website", "accommodations"] as const,
  accommodationOptions: ["admin", "website", "accommodations", "options"] as const,
  faqs: ["admin", "website", "faqs"] as const,
  videos: ["admin", "website", "videos"] as const,
  video: (id: string) => ["admin", "website", "videos", id] as const,
  paymentLinks: ["admin", "website", "payment-links"] as const,
  tourOrders: ["admin", "orders", "tours"] as const,
  transferOrders: ["admin", "orders", "transfers"] as const,
  quickOrders: ["admin", "orders", "quick"] as const,
  insurance: ["admin", "orders", "insurance"] as const,
  paymentStatuses: ["admin", "orders", "statuses"] as const,
  driverOptions: ["admin", "drivers", "options"] as const,
};

const listQuery = <T>(
  key: readonly unknown[],
  fetcher: (params: ListParams) => Promise<T>,
  params: ListParams
) => ({
  queryKey: [...key, params] as const,
  queryFn: () => fetcher(params),
  placeholderData: keepPreviousData,
  retry: adminRetry,
});

export const useAdminTours = (params: ListParams) =>
  useQuery(listQuery(adminKeys.tours, adminToursApi.list, params));

export const useAdminTransfers = (params: ListParams) =>
  useQuery(listQuery(adminKeys.transfers, adminTransfersApi.list, params));

export const useAdminAccommodations = (params: ListParams) =>
  useQuery(
    listQuery(adminKeys.accommodations, adminAccommodationsApi.list, params)
  );

export const useAccommodationFilterOptions = () =>
  useQuery({
    queryKey: adminKeys.accommodationOptions,
    queryFn: adminAccommodationsApi.filterOptions,
    staleTime: 5 * 60 * 1000,
    retry: adminRetry,
  });

export const useAdminFaqs = () =>
  useQuery({
    queryKey: adminKeys.faqs,
    queryFn: adminFaqApi.all,
    retry: adminRetry,
  });

export const useAdminVideos = () =>
  useQuery({
    queryKey: adminKeys.videos,
    queryFn: adminVideosApi.all,
    retry: adminRetry,
  });

export const useAdminVideo = (id?: string) =>
  useQuery({
    queryKey: adminKeys.video(id ?? ""),
    queryFn: () => adminVideosApi.get(id!),
    enabled: !!id,
    retry: adminRetry,
  });

export const useAdminPaymentLinks = (params: ListParams) =>
  useQuery(listQuery(adminKeys.paymentLinks, adminPaymentLinksApi.list, params));

export const useAdminTourOrders = (params: ListParams) =>
  useQuery(listQuery(adminKeys.tourOrders, adminTourOrdersApi.list, params));

export const useAdminTransferOrders = (params: ListParams) =>
  useQuery(
    listQuery(adminKeys.transferOrders, adminTransferOrdersApi.list, params)
  );

export const useAdminQuickOrders = (params: ListParams) =>
  useQuery(listQuery(adminKeys.quickOrders, adminQuickOrdersApi.list, params));

export const useAdminInsuranceSubmissions = (params: ListParams) =>
  useQuery(listQuery(adminKeys.insurance, adminInsuranceApi.list, params));

export const useAdminPaymentStatuses = (params: ListParams) =>
  useQuery(
    listQuery(adminKeys.paymentStatuses, adminPaymentStatusesApi.list, params)
  );

export const useDriverOptions = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.driverOptions,
    queryFn: driverOptionsApi.all,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

/** Mutation helper that refreshes the matching list afterwards. */
function useListMutation<TVars>(
  key: readonly unknown[],
  mutationFn: (vars: TVars) => Promise<unknown>,
  extraKeys: readonly (readonly unknown[])[] = []
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      for (const extra of extraKeys) {
        queryClient.invalidateQueries({ queryKey: extra });
      }
    },
  });
}

export const useDeleteTour = () =>
  useListMutation(adminKeys.tours, adminToursApi.remove, [["tours"]]);

export const useDeleteTransfer = () =>
  useListMutation(adminKeys.transfers, adminTransfersApi.remove, [
    ["transfers"],
  ]);

export const useDeleteAccommodationRow = () =>
  useListMutation(adminKeys.accommodations, adminAccommodationsApi.remove, [
    ["admin-accommodations"],
    ["accommodations"],
  ]);

export const useDeleteFaq = () =>
  useListMutation(adminKeys.faqs, adminFaqApi.remove, [["faqs"]]);

export const useDeleteVideo = () =>
  useListMutation(adminKeys.videos, adminVideosApi.remove, [["videos"]]);

export const useTogglePaymentLink = () =>
  useListMutation(adminKeys.paymentLinks, adminPaymentLinksApi.toggle);

export const useDeletePaymentLink = () =>
  useListMutation(adminKeys.paymentLinks, adminPaymentLinksApi.remove);

export const useDeleteQuickOrder = () =>
  useListMutation(adminKeys.quickOrders, adminQuickOrdersApi.remove, [
    adminKeys.paymentStatuses,
  ]);

export const useDeleteInsuranceSubmission = () =>
  useListMutation(adminKeys.insurance, adminInsuranceApi.remove, [
    adminKeys.paymentStatuses,
  ]);

export const useDeleteFailedTourOrders = () =>
  useListMutation(adminKeys.tourOrders, adminTourOrdersApi.deleteFailed, [
    adminKeys.paymentStatuses,
  ]);

export const useDeleteFailedTransferOrders = () =>
  useListMutation(
    adminKeys.transferOrders,
    adminTransferOrdersApi.deleteFailed,
    [adminKeys.paymentStatuses]
  );

export const useDeleteExpiredTransferOrders = () =>
  useListMutation(
    adminKeys.transferOrders,
    adminTransferOrdersApi.deleteExpired,
    [adminKeys.paymentStatuses]
  );

export const useAssignTransferDriver = () =>
  useListMutation(
    adminKeys.transferOrders,
    ({ orderId, driverId }: { orderId: string; driverId: string | null }) =>
      adminTransferOrdersApi.assignDriver(orderId, driverId)
  );
