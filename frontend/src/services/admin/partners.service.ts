import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  Partner,
  PartnerOption,
  PartnerPayload,
} from "@/src/types/admin/partners.types";
import { cleanParams } from "./access.service";

export const partnersApi = {
  list: async (params: ListParams): Promise<Paginated<Partner>> =>
    (
      await axiosInstance.get<Paginated<Partner>>("/partners", {
        params: cleanParams(params),
      })
    ).data,

  options: async (): Promise<PartnerOption[]> =>
    (await axiosInstance.get<{ data: PartnerOption[] }>("/partners/options"))
      .data.data,

  get: async (id: string): Promise<Partner> =>
    (await axiosInstance.get<{ data: Partner }>(`/partners/${id}`)).data.data,

  create: async (payload: PartnerPayload): Promise<Partner> =>
    (await axiosInstance.post<{ data: Partner }>("/partners", payload)).data
      .data,

  update: async (id: string, payload: PartnerPayload): Promise<Partner> =>
    (await axiosInstance.put<{ data: Partner }>(`/partners/${id}`, payload))
      .data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/partners/${id}`);
  },
};
