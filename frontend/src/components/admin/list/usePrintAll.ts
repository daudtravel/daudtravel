"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Paginated } from "@/src/types/admin/common.types";

/** Upper bound for "print all results" (matches the API's max page size). */
export const PRINT_ALL_LIMIT = 500;

/**
 * "Print all results": loads up to PRINT_ALL_LIMIT rows with the current
 * filters, renders them instead of the current page, prints, then restores.
 */
export function usePrintAll<T>(
  fetchAll: (limit: number) => Promise<Paginated<T>>
) {
  const t = useTranslations("admin.print");
  const [printRows, setPrintRows] = useState<T[] | null>(null);

  useEffect(() => {
    if (!printRows) return;
    const restore = () => setPrintRows(null);
    window.addEventListener("afterprint", restore, { once: true });
    // Two frames so the full list is laid out before the print snapshot.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.removeEventListener("afterprint", restore);
    };
  }, [printRows]);

  const printAll = useCallback(async () => {
    try {
      const result = await fetchAll(PRINT_ALL_LIMIT);
      if (result.meta.total > result.data.length) {
        toast.info(t("printAllLimited", { count: result.data.length }));
      }
      setPrintRows(result.data);
    } catch {
      toast.error(t("printFailed"));
    }
  }, [fetchAll, t]);

  return { printRows, printAll };
}
