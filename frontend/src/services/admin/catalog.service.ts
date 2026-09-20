import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  CatalogItem,
  CatalogOption,
  CatalogPayload,
} from "@/src/types/admin/catalog.types";
import { cleanParams } from "./access.service";

export const catalogApi = {
  list: async (params: ListParams): Promise<Paginated<CatalogItem>> =>
    (
      await axiosInstance.get<Paginated<CatalogItem>>("/catalog", {
        params: cleanParams(params),
      })
    ).data,

  options: async (): Promise<CatalogOption[]> =>
    (await axiosInstance.get<{ data: CatalogOption[] }>("/catalog/options"))
      .data.data,

  filterOptions: async (): Promise<{ cities: string[] }> =>
    (
      await axiosInstance.get<{ data: { cities: string[] } }>(
        "/catalog/filter-options"
      )
    ).data.data,

  create: async (payload: CatalogPayload): Promise<CatalogItem> =>
    (await axiosInstance.post<{ data: CatalogItem }>("/catalog", payload)).data
      .data,

  update: async (id: string, payload: CatalogPayload): Promise<CatalogItem> =>
    (await axiosInstance.put<{ data: CatalogItem }>(`/catalog/${id}`, payload))
      .data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/catalog/${id}`);
  },
};
