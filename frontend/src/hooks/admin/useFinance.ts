"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { financeApi } from "@/src/services/admin/finance.service";
import type { ListParams } from "@/src/types/admin/common.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const financeKeys = {
  report: (params: ListParams) =>
    ["admin", "finance", "report", params] as const,
};

export const useFinanceReport = (params: ListParams) =>
  useQuery({
    queryKey: financeKeys.report(params),
    queryFn: () => financeApi.report(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });
