// src/services/insurance.service.ts

import { axiosInstance } from "../utlis/axiosInstance";

export interface InsurancePerson {
  fullName: string;
  phoneNumber: string;
  passportPhoto: string; // base64
}

export interface CreateInsuranceSubmissionDto {
  submitterEmail: string;
  people: InsurancePerson[];
}

export interface UpdateInsuranceSettingsDto {
  pricePerPerson?: number;
  adminEmail?: string;
  isActive?: boolean;
}

export const insuranceService = {
  // Public endpoints
  getSettings: async () => {
    const { data } = await axiosInstance.get("/insurance/settings");
    return data;
  },

  submitInsurance: async (dto: CreateInsuranceSubmissionDto) => {
    const { data } = await axiosInstance.post("/insurance/submit", dto);
    return data;
  },

  getSubmissionStatus: async (externalOrderId: string) => {
    const { data } = await axiosInstance.get(
      `/insurance/status/${externalOrderId}`
    );
    return data;
  },

  // Admin endpoints
  updateSettings: async (dto: UpdateInsuranceSettingsDto) => {
    const { data } = await axiosInstance.put("/insurance/settings", dto);
    return data;
  },

  getAllSubmissions: async (
    status?: string,
    page: number = 1,
    limit: number = 50
  ) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const { data } = await axiosInstance.get(
      `/insurance/submissions?${params}`
    );
    return data;
  },

  getSubmissionById: async (submissionId: string) => {
    const { data } = await axiosInstance.get(
      `/insurance/submissions/${submissionId}`
    );
    return data;
  },

  deleteSubmission: async (submissionId: string) => {
    const { data } = await axiosInstance.delete(
      `/insurance/submissions/${submissionId}`
    );
    return data;
  },

  // Maintenance endpoints
  cleanupOldSubmissions: async (monthsOld?: number) => {
    const params = monthsOld ? `?monthsOld=${monthsOld}` : "";
    const { data } = await axiosInstance.post(
      `/insurance/maintenance/cleanup-old${params}`
    );
    return data;
  },

  cleanupAbandonedSubmissions: async (daysOld?: number) => {
    const params = daysOld ? `?daysOld=${daysOld}` : "";
    const { data } = await axiosInstance.post(
      `/insurance/maintenance/cleanup-abandoned${params}`
    );
    return data;
  },

  bulkDeleteSubmissions: async (submissionIds: string[]) => {
    const { data } = await axiosInstance.post(
      "/insurance/maintenance/bulk-delete",
      {
        submissionIds,
      }
    );
    return data;
  },

  getStorageStats: async () => {
    const { data } = await axiosInstance.get("/insurance/maintenance/stats");
    return data;
  },
};
