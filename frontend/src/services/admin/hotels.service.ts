import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  Hotel,
  HotelOption,
  HotelPayload,
} from "@/src/types/admin/hotels.types";
import { cleanParams } from "./access.service";

export const hotelsApi = {
  list: async (params: ListParams): Promise<Paginated<Hotel>> =>
    (
      await axiosInstance.get<Paginated<Hotel>>("/hotels", {
        params: cleanParams(params),
      })
    ).data,

  get: async (id: string): Promise<Hotel> =>
    (await axiosInstance.get<{ data: Hotel }>(`/hotels/${id}`)).data.data,

  options: async (): Promise<HotelOption[]> =>
    (await axiosInstance.get<{ data: HotelOption[] }>("/hotels/options")).data
      .data,

  filterOptions: async (): Promise<{ cities: string[]; regions: string[] }> =>
    (
      await axiosInstance.get<{
        data: { cities: string[]; regions: string[] };
      }>("/hotels/filter-options")
    ).data.data,

  create: async (payload: HotelPayload): Promise<Hotel> =>
    (await axiosInstance.post<{ data: Hotel }>("/hotels", payload)).data.data,

  update: async (id: string, payload: HotelPayload): Promise<Hotel> =>
    (await axiosInstance.put<{ data: Hotel }>(`/hotels/${id}`, payload)).data
      .data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/hotels/${id}`);
  },
};
