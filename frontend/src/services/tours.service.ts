import {
  CreateTourInput,
  UpdateTourInput,
  GetToursResponse,
  GetSingleTourResponse,
  CreateTourResponse,
  UpdateTourResponse,
  ToursQueryParams,
} from "@/src/types/tours.type";
import { axiosInstance } from "../utlis/axiosInstance";

export const toursService = {
  create: async (data: CreateTourInput): Promise<CreateTourResponse> => {
    const response = await axiosInstance.post("/tours", data);
    return response.data;
  },
  getAll: async (params: ToursQueryParams = {}): Promise<GetToursResponse> => {
    const response = await axiosInstance.get("/tours", { params });
    return response.data;
  },
  getAdmin: async (
    params: ToursQueryParams = {}
  ): Promise<GetToursResponse> => {
    const response = await axiosInstance.get("/tours/all", { params });
    return response.data;
  },

  getById: async (
    id: string,
    locale: string
  ): Promise<GetSingleTourResponse> => {
    const response = await axiosInstance.get(`/tours/${id}`, {
      params: { locale },
    });
    return response.data;
  },

  getByIdAllLocales: async (id: string): Promise<GetSingleTourResponse> => {
    const response = await axiosInstance.get(`/tours/${id}`);
    return response.data;
  },

  put: async (
    id: string,
    data: UpdateTourInput
  ): Promise<UpdateTourResponse> => {
    const response = await axiosInstance.put(`/tours/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/tours/${id}`);
  },

  getFilterOptions: async (locale: string): Promise<GetToursResponse> => {
    return toursService.getAll({ locale });
  },
};

export const toursAPI = toursService;
