import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quickPaymentService } from "@/src/services/quick-payment.service";

// ============ PUBLIC HOOKS ============

export const usePublicQuickLinks = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["public-quick-links", page, limit],
    queryFn: () => quickPaymentService.getPublicLinks(page, limit),
  });
};

// ============ ADMIN HOOKS ============

export const useQuickLinks = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ["quick-links", page, limit],
    queryFn: () => quickPaymentService.getAllLinks(page, limit),
  });
};

export const useQuickLink = (slug: string) => {
  return useQuery({
    queryKey: ["quick-link", slug],
    queryFn: () => quickPaymentService.getLink(slug),
    enabled: !!slug,
  });
};

export const useCreateQuickLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickPaymentService.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["public-quick-links"] });
    },
  });
};

export const useUpdateQuickLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) =>
      quickPaymentService.updateLink(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["quick-link"] });
      queryClient.invalidateQueries({ queryKey: ["public-quick-links"] });
    },
  });
};

export const useToggleQuickLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickPaymentService.toggleLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["public-quick-links"] });
    },
  });
};

export const useDeleteQuickLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickPaymentService.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-links"] });
      queryClient.invalidateQueries({ queryKey: ["public-quick-links"] });
    },
  });
};

export const useQuickPaymentOrders = (
  linkId?: string,
  status?: string,
  page: number = 1,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ["quick-payment-orders", linkId, status, page, limit],
    queryFn: () =>
      quickPaymentService.getAllOrders(linkId, status, page, limit),
  });
};
