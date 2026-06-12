import {
  CreateAccommodationInput,
  UpdateAccommodationInput,
  GetAccommodationsResponse,
  GetSingleAccommodationResponse,
  CreateAccommodationResponse,
  UpdateAccommodationResponse,
  AccommodationsQueryParams,
} from "@/src/types/accommodations.type";
import { axiosInstance } from "../utlis/axiosInstance";

export const accommodationsService = {
  create: async (
    data: CreateAccommodationInput
  ): Promise<CreateAccommodationResponse> => {
    const response = await axiosInstance.post("/accommodations", data);
    return response.data;
  },

  getAll: async (
    params: AccommodationsQueryParams = {}
  ): Promise<GetAccommodationsResponse> => {
    const response = await axiosInstance.get("/accommodations", { params });
    return response.data;
  },

  getAdmin: async (
    params: AccommodationsQueryParams = {}
  ): Promise<GetAccommodationsResponse> => {
    const response = await axiosInstance.get("/accommodations/all", { params });
    return response.data;
  },

  getById: async (
    id: string,
    locale: string
  ): Promise<GetSingleAccommodationResponse> => {
    const response = await axiosInstance.get(`/accommodations/${id}`, {
      params: { locale },
    });
    return response.data;
  },

  getByIdAllLocales: async (
    id: string
  ): Promise<GetSingleAccommodationResponse> => {
    const response = await axiosInstance.get(`/accommodations/${id}`);
    return response.data;
  },

  put: async (
    id: string,
    data: UpdateAccommodationInput
  ): Promise<UpdateAccommodationResponse> => {
    const response = await axiosInstance.put(`/accommodations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/accommodations/${id}`);
  },
};

export const accommodationsAPI = accommodationsService;
