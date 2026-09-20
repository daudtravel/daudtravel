"use client";

import { useMemo } from "react";
import type { PaginationMeta } from "@/src/types/admin/common.types";

/**
 * Pages and sorts an already-loaded collection in the browser. Used for the
 * small endpoints (FAQ, videos) that return everything at once, so those lists
 * still get the same filters/pagination as the server-side ones.
 */
export function useClientPage<T>(
  rows: T[] | undefined,
  {
    page,
    limit,
    filter,
    sort,
  }: {
    page: number;
    limit: number;
    filter?: (row: T) => boolean;
    sort?: (a: T, b: T) => number;
  }
): { rows: T[]; all: T[]; meta: PaginationMeta } {
  return useMemo(() => {
    const filtered = (rows ?? []).filter((row) => (filter ? filter(row) : true));
    const sorted = sort ? [...filtered].sort(sort) : filtered;
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    return {
      rows: sorted.slice(start, start + limit),
      all: sorted,
      meta: { total, page: safePage, limit, totalPages },
    };
  }, [rows, page, limit, filter, sort]);
}
