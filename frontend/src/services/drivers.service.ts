import { axiosInstance } from "../utlis/axiosInstance";

export interface DriverReview {
  id: string;
  driverId: string;
  rating: number;
  comment?: string | null;
  reviewerName: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  languages: string[];
  dailyRentPrice: number | null;
  carPhotos: string[];
  averageRating: number | null;
  totalReviews: number;
  recentReviews: DriverReview[];
  createdAt: string;
  updatedAt: string;
}

export interface DriverResponse {
  message: string;
  data: Driver;
}

export interface UpdateDriverPayload {
  firstName?: string;
  lastName?: string;
  languages?: string[];
  dailyRentPrice?: number | null;
}

export interface DriversResponse {
  message: string;
  count: number;
  data: Driver[];
}

export interface DriverReviewsResponse {
  message: string;
  data: {
    driverId: string;
    averageRating: number | null;
    totalReviews: number;
    reviews: DriverReview[];
  };
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
  reviewerName: string;
}

export const driversAPI = {
  get: async (): Promise<DriversResponse> => {
    const response = await axiosInstance.get(`/drivers`);
    return response.data;
  },

  post: async (data: FormData) => {
    const response = await axiosInstance.post(`/drivers/add_driver`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getById: async (id: string): Promise<DriverResponse> => {
    const response = await axiosInstance.get(`/drivers/${id}`);
    return response.data;
  },

  update: async (id: string, payload: UpdateDriverPayload): Promise<DriverResponse> => {
    const response = await axiosInstance.patch(`/drivers/${id}`, payload);
    return response.data;
  },

  uploadCarPhotos: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    const response = await axiosInstance.post(`/drivers/${id}/car-photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteCarPhoto: async (id: string, url: string) => {
    const response = await axiosInstance.delete(`/drivers/${id}/car-photos`, {
      data: { url },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/drivers/${id}`);
    return response.data;
  },

  getReviews: async (driverId: string): Promise<DriverReviewsResponse> => {
    const response = await axiosInstance.get(`/drivers/${driverId}/reviews`);
    return response.data;
  },

  createReview: async (driverId: string, payload: CreateReviewPayload) => {
    const response = await axiosInstance.post(`/drivers/${driverId}/reviews`, payload);
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await axiosInstance.delete(`/drivers/reviews/${reviewId}`);
    return response.data;
  },
};
