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
  averageRating: number | null;
  totalReviews: number;
  recentReviews: DriverReview[];
  createdAt: string;
  updatedAt: string;
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
