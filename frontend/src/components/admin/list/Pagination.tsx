"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/src/utlis/cn";
import { formatNumber } from "@/src/utlis/admin/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { PaginationMeta } from "@/src/types/admin/common.types";
import { PAGE_SIZE_OPTIONS } from "./useListQuery";

interface PaginationProps {
  meta: PaginationMeta | null | undefined;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("gap");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("gap");
  pages.push(total);
  return pages;
}

export default function Pagination({
  meta,
  onPageChange,
  onLimitChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}: PaginationProps) {
  const t = useTranslations("admin.list");
  const locale = useLocale();
  const [jump, setJump] = useState("");

  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? pageSizeOptions[0];
  const totalPages = Math.max(1, meta?.totalPages ?? 1);

  // Keep the page in range when the result set shrinks (e.g. after deleting
  // the last row of the last page or narrowing the filters).
  useEffect(() => {
    if (meta && meta.total > 0 && meta.page > meta.totalPages) {
      onPageChange(meta.totalPages);
    }
  }, [meta, onPageChange]);

  if (!meta || total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const go = (p: number) => {
    const target = Math.min(Math.max(1, p), totalPages);
    if (target !== page) onPageChange(target);
  };

  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-brand-green-100 hover:bg-brand-green-50 hover:text-brand-green disabled:pointer-events-none disabled:opacity-40";

  const sizeOptions = pageSizeOptions.includes(limit)
    ? pageSizeOptions
    : [...pageSizeOptions, limit].sort((a, b) => a - b);

  return (
    <nav
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row print:hidden",
        className
      )}
      aria-label={t("pagination")}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span className="tabular-nums">
          {t("showing", {
            from: formatNumber(from, locale),
            to: formatNumber(to, locale),
            total: formatNumber(total, locale),
          })}
        </span>
        {onLimitChange && (
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">{t("perPage")}</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => onLimitChange(Number(v))}
            >
              <SelectTrigger className="h-9 w-[76px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(navButton, "hidden sm:flex")}
            onClick={() => go(1)}
            disabled={page <= 1}
            aria-label={t("first")}
          >
            <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            className={navButton}
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>

          {/* Compact indicator on phones */}
          <span className="px-2 text-sm font-medium text-gray-600 tabular-nums sm:hidden">
            {page} / {totalPages}
          </span>

          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === "gap" ? (
                <span
                  key={`gap-${i}`}
                  className="flex h-9 w-7 items-end justify-center pb-2 text-gray-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => go(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "h-9 min-w-9 rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors",
                    p === page
                      ? "bg-brand-green text-brand-cream shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-brand-green-100 hover:bg-brand-green-50 hover:text-brand-green"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className={navButton}
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            aria-label={t("next")}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            className={cn(navButton, "hidden sm:flex")}
            onClick={() => go(totalPages)}
            disabled={page >= totalPages}
            aria-label={t("last")}
          >
            <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
          </button>

          {totalPages > 7 && (
            <form
              className="ms-2 hidden items-center gap-1.5 md:flex"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(jump);
                if (Number.isInteger(n) && n > 0) go(n);
                setJump("");
              }}
            >
              <label htmlFor="admin-page-jump" className="text-sm text-gray-500">
                {t("goToPage")}
              </label>
              <input
                id="admin-page-jump"
                inputMode="numeric"
                value={jump}
                onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
                className="h-9 w-14 rounded-lg border border-gray-200 px-2 text-center text-sm tabular-nums focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                placeholder={String(page)}
              />
            </form>
          )}
        </div>
      )}
    </nav>
  );
}
