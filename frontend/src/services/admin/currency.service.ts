import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  CurrencyCode,
  LatestRate,
  RateRow,
  RefreshResult,
} from "@/src/types/admin/currency.types";
import { cleanParams } from "./access.service";

export const currencyApi = {
  latest: async (): Promise<LatestRate[]> =>
    (await axiosInstance.get<{ data: LatestRate[] }>("/currency/rates/latest"))
      .data.data,

  history: async (params: ListParams): Promise<Paginated<RateRow>> =>
    (
      await axiosInstance.get<Paginated<RateRow>>("/currency/rates", {
        params: cleanParams(params),
      })
    ).data,

  refresh: async (): Promise<RefreshResult> =>
    (await axiosInstance.post<RefreshResult>("/currency/rates/refresh")).data,

  setRate: async (payload: {
    currency: CurrencyCode;
    date: string;
    rate: number;
  }) => (await axiosInstance.put("/currency/rates", payload)).data,
};
