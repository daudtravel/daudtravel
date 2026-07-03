import { axiosInstance } from "../utlis/axiosInstance";

export const paymentStatsService = {
  getStats: async () => {
    const response = await axiosInstance.get(`/payment-stats`);
    return response.data;
  },
};
