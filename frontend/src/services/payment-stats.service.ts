import { axiosInstance } from "../utlis/axiosInstance";

export const paymentStatsService = {
  getStats: async () => {
    const response = await axiosInstance.get(`/payment-stats`);
    return response.data;
  },

  getOrders: async (params: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get(`/payment-stats/orders`, {
      params,
    });
    return response.data;
  },
};
