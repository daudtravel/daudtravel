"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { currencyApi } from "@/src/services/admin/currency.service";
import type { ListParams } from "@/src/types/admin/common.types";
import { adminRetry } from "@/src/utlis/admin/errors";
import { useAuth } from "@/src/auth/authProvider";
import {
  BASE_CURRENCY,
  type CurrencyCode,
} from "@/src/types/admin/currency.types";

export const currencyKeys = {
  latest: ["admin", "currency", "latest"] as const,
  history: (params: ListParams) =>
    ["admin", "currency", "history", params] as const,
};

export function useLatestRates(enabled = true) {
  return useQuery({
    queryKey: currencyKeys.latest,
    queryFn: currencyApi.latest,
    staleTime: 10 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });
}

export function useRateHistory(params: ListParams) {
  return useQuery({
    queryKey: currencyKeys.history(params),
    queryFn: () => currencyApi.history(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });
}

export function useRefreshRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: currencyApi.refresh,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "currency"] }),
  });
}

export function useSetRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: currencyApi.setRate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "currency"] }),
  });
}

/** `{ USD: 2.6071, … }` — GEL per unit, for client-side conversion. */
export function useRateMap() {
  const { data, isLoading } = useLatestRates();
  const rates = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of data ?? []) map[row.currency] = row.rate;
    return map;
  }, [data]);
  return { rates, isLoading };
}

/** The signed-in user's report currency (falls back to the base currency). */
export function usePreferredCurrency(): CurrencyCode {
  const { user } = useAuth();
  return (user?.preferredCurrency as CurrencyCode) ?? BASE_CURRENCY;
}
