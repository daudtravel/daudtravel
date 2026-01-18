import { axiosInstance } from "../utlis/axiosInstance";

export interface FAQLocalization {
  id?: string;
  locale: string;
  question: string;
  answer: string;
}

export interface FAQ {
  id: string;
  category?: string;
  localizations: FAQLocalization[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQDto {
  localizations: Omit<FAQLocalization, "id">[];
  category?: string;
}

export interface UpdateFAQDto {
  localizations?: Omit<FAQLocalization, "id">[];
  category?: string;
}

export const faqApi = {
  get: async (locale?: string) => {
    const params = locale ? { locale } : {};
    const response = await axiosInstance.get("/faq/faq", { params });
    return response.data;
  },

  getById: async (id: string, locale?: string) => {
    const params = locale ? { locale } : {};
    const response = await axiosInstance.get(`/faq/faq/${id}`, { params });
    return response.data;
  },

  post: async (data: CreateFAQDto) => {
    const response = await axiosInstance.post("/faq/create_faq", data);
    return response.data;
  },

  put: async (id: string, data: UpdateFAQDto) => {
    const response = await axiosInstance.put(`/faq/update_faq/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/faq/delete_faq/${id}`);
    return response.data;
  },
};
