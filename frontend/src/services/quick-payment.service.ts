import { axiosInstance } from "../utlis/axiosInstance";

export const quickPaymentService = {
  // ============ PUBLIC METHODS ============

  getPublicLinks: async (
    page: number = 1,
    limit: number = 10,
    locale: string = "ka"
  ) => {
    const response = await axiosInstance.get(`/quick-payment/public/links`, {
      params: { page, limit, locale },
    });
    return response.data;
  },

  /**
   * Get link for public users (single localization based on locale param)
   * Falls back to Georgian if requested locale is not available
   */
  getLink: async (slug: string, locale: string = "ka") => {
    const response = await axiosInstance.get(`/quick-payment/links/${slug}`, {
      params: { locale },
    });
    return response.data;
  },

  initiatePayment: async (
    slug: string,
    data: {
      customerFullName: string;
      customerEmail: string;
      customerPhone?: string;
      locale?: string;
      quantity?: number;
    }
  ) => {
    const response = await axiosInstance.post(
      `/quick-payment/links/${slug}/pay`,
      data
    );
    return response.data;
  },

  getPaymentStatus: async (externalOrderId: string) => {
    const response = await axiosInstance.get(
      `/quick-payment/status/${externalOrderId}`
    );
    return response.data;
  },

  // ============ AUTHENTICATED METHODS ============

  /**
   * Get single link details for authenticated users (includes all localizations)
   * Backend automatically detects authentication via token and returns all localizations
   */
  getAuthenticatedLink: async (slug: string) => {
    const response = await axiosInstance.get(`/quick-payment/links/${slug}`);
    return response.data;
  },

  getAllLinks: async (
    page: number = 1,
    limit: number = 20,
    locale?: string
  ) => {
    const response = await axiosInstance.get(`/quick-payment/links`, {
      params: { page, limit, locale },
    });
    return response.data;
  },

  createLink: async (data: {
    localizations: Array<{
      locale: string;
      name: string;
      description?: string;
    }>;
    image?: string;
    price: number;
    showOnWebsite?: boolean;
  }) => {
    const response = await axiosInstance.post(`/quick-payment/links`, data);
    return response.data;
  },

  updateLink: async (
    slug: string,
    data: {
      localizations?: Array<{
        locale: string;
        name: string;
        description?: string;
      }>;
      image?: string;
      price?: number;
      showOnWebsite?: boolean;
    }
  ) => {
    const response = await axiosInstance.put(
      `/quick-payment/links/${slug}`,
      data
    );
    return response.data;
  },

  toggleLink: async (slug: string) => {
    const response = await axiosInstance.post(
      `/quick-payment/links/${slug}/toggle`
    );
    return response.data;
  },

  deleteLink: async (slug: string) => {
    const response = await axiosInstance.delete(`/quick-payment/links/${slug}`);
    return response.data;
  },

  getAllOrders: async (
    linkId?: string,
    status?: string,
    page: number = 1,
    limit: number = 50
  ) => {
    const response = await axiosInstance.get(`/quick-payment/orders`, {
      params: { linkId, status, page, limit },
    });
    return response.data;
  },

  getOrderById: async (orderId: string) => {
    const response = await axiosInstance.get(
      `/quick-payment/orders/${orderId}`
    );
    return response.data;
  },
};
