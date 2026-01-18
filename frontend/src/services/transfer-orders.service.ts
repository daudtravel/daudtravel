import { axiosInstance } from "../utlis/axiosInstance";

export const transferOrdersAPI = {
  get: async (page: number = 1, limit: number = 10, status?: string) => {
    const params: any = { page, limit };
    if (status) params.status = status;

    const response = await axiosInstance.get("/transfers/orders", { params });
    return response.data;
  },

  deleteFailedOrders: async () => {
    const response = await axiosInstance.delete("/transfers/orders/failed");
    return response.data;
  },

  deleteExpiredOrders: async () => {
    const response = await axiosInstance.delete("/transfers/orders/expired");
    return response.data;
  },

  cleanupOrders: async () => {
    const response = await axiosInstance.delete("/transfers/orders/cleanup");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get(`/transfers/orders/${id}`);
    return response.data;
  },
};
