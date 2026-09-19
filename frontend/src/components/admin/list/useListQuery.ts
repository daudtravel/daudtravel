"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortOrder } from "@/src/types/admin/common.types";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface UseListQueryOptions<F extends string> {
  /** Filter keys kept in the URL (besides page/limit/sort). */
  filters: readonly F[];
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  /** Fixed filter values (not shown in the URL), e.g. a scope from a tab. */
  fixed?: Record<string, string | undefined>;
}

const RESERVED = ["page", "limit", "sortBy", "sortOrder"];

/**
 * List state (filters, page, page size, sort) stored in the URL so lists are
 * shareable, survive reloads and work with back/forward. Changing a filter or
 * the page size jumps back to page 1.
 */
export function useListQuery<F extends string>({
  filters,
  defaultLimit = 10,
  defaultSortBy,
  defaultSortOrder = "desc",
  fixed,
}: UseListQueryOptions<F>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const readInt = (key: string, fallback: number) => {
    const raw = Number(searchParams.get(key));
    return Number.isInteger(raw) && raw > 0 ? raw : fallback;
  };

  const page = readInt("page", 1);
  const limitRaw = readInt("limit", defaultLimit);
  const limit = Math.min(limitRaw, 100);
  const sortBy = searchParams.get("sortBy") ?? defaultSortBy;
  const sortOrderRaw = searchParams.get("sortOrder");
  const sortOrder: SortOrder =
    sortOrderRaw === "asc" || sortOrderRaw === "desc"
      ? sortOrderRaw
      : defaultSortOrder;

  const filterKey = filters.join("|");
  const values = useMemo(() => {
    const out = {} as Record<F, string>;
    for (const key of filterKey.split("|") as F[]) {
      if (key) out[key] = searchParams.get(key) ?? "";
    }
    return out;
  }, [searchParams, filterKey]);

  const update = useCallback(
    (changes: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      if (next.get("page") === "1") next.delete("page");
      if (next.get("limit") === String(defaultLimit)) next.delete("limit");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname, defaultLimit]
  );

  const setFilter = useCallback(
    (key: F, value: string | null | undefined) =>
      update({ [key]: value, page: null }),
    [update]
  );

  const setFilters = useCallback(
    (changes: Partial<Record<F, string | null | undefined>>) =>
      update({ ...changes, page: null }),
    [update]
  );

  const resetFilters = useCallback(() => {
    const cleared: Record<string, null> = { page: null };
    for (const key of filterKey.split("|")) if (key) cleared[key] = null;
    update(cleared);
  }, [update, filterKey]);

  const setPage = useCallback(
    (nextPage: number) => update({ page: nextPage > 1 ? nextPage : null }),
    [update]
  );

  const setLimit = useCallback(
    (nextLimit: number) => update({ limit: nextLimit, page: null }),
    [update]
  );

  /** Click on a sortable header: new field → asc/desc default, same field → toggle. */
  const toggleSort = useCallback(
    (field: string, firstOrder: SortOrder = "asc") => {
      if (sortBy === field) {
        update({ sortBy: field, sortOrder: sortOrder === "asc" ? "desc" : "asc" });
      } else {
        update({ sortBy: field, sortOrder: firstOrder });
      }
    },
    [sortBy, sortOrder, update]
  );

  const activeFilterCount = Object.values(values).filter(
    (v) => (v as string) !== ""
  ).length;

  /** Params for the API: page, limit, sort + non-empty filters. */
  const params = useMemo(() => {
    const out: Record<string, string | number> = { page, limit };
    if (sortBy) {
      out.sortBy = sortBy;
      out.sortOrder = sortOrder;
    }
    for (const [key, value] of Object.entries(values)) {
      if (value) out[key] = value as string;
    }
    for (const [key, value] of Object.entries(fixed ?? {})) {
      if (value) out[key] = value;
      else delete out[key];
    }
    return out;
  }, [page, limit, sortBy, sortOrder, values, fixed]);

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    values,
    params,
    activeFilterCount,
    setFilter,
    setFilters,
    resetFilters,
    setPage,
    setLimit,
    toggleSort,
    isReserved: (key: string) => RESERVED.includes(key),
  };
}

export type ListQuery<F extends string = string> = ReturnType<
  typeof useListQuery<F>
>;
