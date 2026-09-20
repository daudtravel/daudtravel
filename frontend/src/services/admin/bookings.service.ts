import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  Booking,
  BookingDraft,
  BookingPayload,
  BookingStatus,
  BookingSummaryRow,
  LinkedOrders,
} from "@/src/types/admin/bookings.types";
import { cleanParams } from "./access.service";

export const bookingsApi = {
  list: async (params: ListParams): Promise<Paginated<Booking>> =>
    (
      await axiosInstance.get<Paginated<Booking>>("/bookings", {
        params: cleanParams(params),
      })
    ).data,

  summary: async (params: ListParams): Promise<BookingSummaryRow[]> =>
    (
      await axiosInstance.get<{ data: BookingSummaryRow[] }>(
        "/bookings/summary",
        { params: cleanParams(params) }
      )
    ).data.data,

  get: async (id: string): Promise<Booking> =>
    (await axiosInstance.get<{ data: Booking }>(`/bookings/${id}`)).data.data,

  linkedOrders: async (): Promise<LinkedOrders> =>
    (await axiosInstance.get<{ data: LinkedOrders }>("/bookings/linked-orders"))
      .data.data,

  draftFromOrder: async (
    type: "TOUR" | "TRANSFER",
    id: string
  ): Promise<BookingDraft> =>
    (
      await axiosInstance.get<{ data: BookingDraft }>(
        "/bookings/draft-from-order",
        { params: { type, id } }
      )
    ).data.data,

  create: async (payload: BookingPayload): Promise<Booking> =>
    (await axiosInstance.post<{ data: Booking }>("/bookings", payload)).data
      .data,

  update: async (id: string, payload: BookingPayload): Promise<Booking> =>
    (await axiosInstance.put<{ data: Booking }>(`/bookings/${id}`, payload))
      .data.data,

  changeStatus: async (id: string, status: BookingStatus): Promise<Booking> =>
    (
      await axiosInstance.patch<{ data: Booking }>(`/bookings/${id}/status`, {
        status,
      })
    ).data.data,

  setSupplierPaid: async (
    itemId: string,
    supplierPaid: boolean
  ): Promise<Booking> =>
    (
      await axiosInstance.patch<{ data: Booking }>(
        `/bookings/items/${itemId}/supplier-paid`,
        { supplierPaid }
      )
    ).data.data,

  setCommissionPaid: async (
    commissionId: string,
    paid: boolean
  ): Promise<Booking> =>
    (
      await axiosInstance.patch<{ data: Booking }>(
        `/bookings/commissions/${commissionId}/paid`,
        { paid }
      )
    ).data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/bookings/${id}`);
  },
};
