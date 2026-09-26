"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/src/utlis/cn";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import type { SortOrder } from "@/src/types/admin/common.types";

export interface DataColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  /** Server-side sort field; makes the header clickable. */
  sortKey?: string;
  align?: "start" | "end" | "center";
  className?: string;
  headerClassName?: string;
  /** Not shown in the mobile card view. */
  hideOnMobile?: boolean;
  /** Not printed (e.g. action buttons). */
  hideOnPrint?: boolean;
  /** Label used in mobile cards when the header isn't plain text. */
  mobileLabel?: React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  /** Custom card for phones; defaults to label/value pairs. */
  mobileCard?: (row: T) => React.ReactNode;
  /** "Filtered and nothing found" vs "no data at all". */
  filtered?: boolean;
  emptyTitle?: string;
  emptyHint?: React.ReactNode;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
  /** Rendered under the table (typically <Pagination/>). */
  pagination?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
}

const alignClass = (align?: "start" | "end" | "center") =>
  align === "end" ? "text-end" : align === "center" ? "text-center" : "";

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  mobileCard,
  filtered,
  emptyTitle,
  emptyHint,
  emptyAction,
  footer,
  pagination,
  skeletonRows = 6,
  className,
  rowClassName,
}: DataTableProps<T>) {
  const t = useTranslations("admin.list");
  const list = rows ?? [];
  const showSkeleton = isLoading && list.length === 0;
  const showError = !isLoading && isError && list.length === 0;
  const showEmpty = !isLoading && !isError && list.length === 0;

  const sortIcon = (column: DataColumn<T>) => {
    if (!column.sortKey) return null;
    if (sortBy !== column.sortKey)
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  const renderHeader = (column: DataColumn<T>) => {
    if (!column.sortKey || !onSort) return column.header;
    const active = sortBy === column.sortKey;
    return (
      <button
        type="button"
        onClick={() => onSort(column.sortKey!)}
        className={cn(
          "inline-flex items-center gap-1 rounded uppercase tracking-wide transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green print:pointer-events-none",
          active && "text-brand-green"
        )}
        aria-label={`${typeof column.header === "string" ? column.header : column.key}: ${
          active && sortOrder === "asc" ? t("sortDesc") : t("sortAsc")
        }`}
      >
        {column.header}
        <span className="print:hidden">{sortIcon(column)}</span>
      </button>
    );
  };

  const state = showSkeleton ? (
    <div className="space-y-3 p-4">
      {Array.from({ length: skeletonRows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  ) : showError ? (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="font-semibold text-gray-800">{t("loadError")}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw />
          {t("retry")}
        </Button>
      )}
    </div>
  ) : showEmpty ? (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green-50 text-brand-green">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="font-semibold text-gray-800">
        {emptyTitle ?? (filtered ? t("noResults") : t("empty"))}
      </p>
      {(emptyHint ?? (filtered ? t("noResultsHint") : null)) && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          {emptyHint ?? t("noResultsHint")}
        </p>
      )}
      {emptyAction && <div className="mt-4 print:hidden">{emptyAction}</div>}
    </div>
  ) : null;

  return (
    <div
      data-print-card
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none",
        isLoading && list.length > 0 && "opacity-60 transition-opacity",
        className
      )}
      aria-busy={isLoading || undefined}
    >
      {state ?? (
        <>
          {/* Table: tablets, desktops and paper */}
          <div className="hidden md:block print:block">
            <Table>
              <TableHeader className="bg-gray-50/70 print:bg-transparent">
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        alignClass(column.align),
                        column.hideOnPrint && "print:hidden",
                        column.headerClassName
                      )}
                      aria-sort={
                        column.sortKey && sortBy === column.sortKey
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {renderHeader(column)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row, index) => (
                  <TableRow
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row)
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          alignClass(column.align),
                          column.hideOnPrint && "print:hidden",
                          column.className
                        )}
                      >
                        {column.cell(row, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              {footer && <TableFooter>{footer}</TableFooter>}
            </Table>
          </div>

          {/* Cards: phones */}
          <ul className="divide-y divide-gray-100 md:hidden print:hidden">
            {list.map((row, index) => (
              <li
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("p-4", onRowClick && "cursor-pointer active:bg-gray-50")}
              >
                {mobileCard ? (
                  mobileCard(row)
                ) : (
                  <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
                    {columns
                      .filter((c) => !c.hideOnMobile)
                      .map((column) => (
                        <div key={column.key} className="contents">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {column.mobileLabel ?? column.header}
                          </dt>
                          <dd className="min-w-0 break-words text-gray-700">
                            {column.cell(row, index)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {pagination}
    </div>
  );
}
