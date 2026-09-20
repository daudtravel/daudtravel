import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams } from "@/src/types/admin/common.types";
import type { FinanceReport } from "@/src/types/admin/finance.types";
import { cleanParams } from "./access.service";

export const financeApi = {
  report: async (params: ListParams): Promise<FinanceReport> =>
    (
      await axiosInstance.get<{ data: FinanceReport }>("/finance/report", {
        params: cleanParams(params),
      })
    ).data.data,
};
