import { CreateVideoDto, UpdateVideoDto } from "../types/video.types";
import { axiosInstance } from "../utlis/axiosInstance";

export const videoApi = {
  get: async (category?: string) => {
    const params = category ? { category } : {};
    const response = await axiosInstance.get("/videos/video", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get(`/videos/video/${id}`);
    return response.data;
  },

  post: async (data: CreateVideoDto) => {
    const response = await axiosInstance.post("/videos/create_video", data);
    return response.data;
  },

  put: async (id: string, data: UpdateVideoDto) => {
    const response = await axiosInstance.put(
      `/videos/update_video/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/videos/delete_video/${id}`);
    return response.data;
  },
};
