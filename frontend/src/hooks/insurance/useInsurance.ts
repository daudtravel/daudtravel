// src/hooks/insurance/useInsurance.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insuranceService } from "@/src/services/insurance.service";

// Settings
export const useInsuranceSettings = () => {
  return useQuery({
    queryKey: ["insurance-settings"],
    queryFn: () => insuranceService.getSettings(),
  });
};

export const useUpdateInsuranceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insuranceService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-settings"] });
    },
  });
};

// Submissions
export const useInsuranceSubmissions = (
  status?: string,
  page: number = 1,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ["insurance-submissions", status, page, limit],
    queryFn: () => insuranceService.getAllSubmissions(status, page, limit),
  });
};

export const useInsuranceSubmission = (submissionId: string) => {
  return useQuery({
    queryKey: ["insurance-submission", submissionId],
    queryFn: () => insuranceService.getSubmissionById(submissionId),
    enabled: !!submissionId,
  });
};

export const useSubmitInsurance = () => {
  return useMutation({
    mutationFn: insuranceService.submitInsurance,
  });
};

export const useDeleteInsuranceSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insuranceService.deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["insurance-stats"] });
    },
  });
};

// Maintenance
export const useCleanupOldSubmissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insuranceService.cleanupOldSubmissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["insurance-stats"] });
    },
  });
};

export const useCleanupAbandonedSubmissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insuranceService.cleanupAbandonedSubmissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["insurance-stats"] });
    },
  });
};

export const useBulkDeleteSubmissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insuranceService.bulkDeleteSubmissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["insurance-stats"] });
    },
  });
};

export const useInsuranceStats = () => {
  return useQuery({
    queryKey: ["insurance-stats"],
    queryFn: () => insuranceService.getStorageStats(),
  });
};
