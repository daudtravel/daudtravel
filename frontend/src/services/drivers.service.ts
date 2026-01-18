import { axiosInstance } from "../utlis/axiosInstance";

export const driversAPI = {
  get: async (locale: string) => {
    const response = await axiosInstance.get(`/drivers`, {
      params: { locale },
    });
    return response.data;
  },

  post: async (data: FormData) => {
    const response = await axiosInstance.post(`/drivers/add_driver`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/drivers/${id}`);
    return response.data;
  },
};
