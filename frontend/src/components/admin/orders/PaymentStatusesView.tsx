"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import PaymentStatusBadge, {
  usePaymentStatusOptions,
} from "@/src/components/admin/common/PaymentStatusBadge";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DateRangeFilter from "@/src/components/admin/list/DateRangeFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import { useAdminPaymentStatuses } from "@/src/hooks/admin/useAdminLists";
import { adminPaymentStatusesApi } from "@/src/services/admin/orders.service";
import { formatDateTime, formatMoney } from "@/src/utlis/admin/format";
import type { PaymentStatusRow } from "@/src/types/admin/orders.types";

const FILTERS = ["search", "type", "status", "dateFrom", "dateTo"] as const;

const TYPE_TONE: Record<
  PaymentStatusRow["type"],
  "blue" | "green" | "yellow" | "purple"
> = {
  tours: "blue",
  transfers: "green",
  quick: "yellow",
  insurance: "purple",
};

export default function PaymentStatusesView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const statusOptions = usePaymentStatusOptions();

  const list = useListQuery({ filters: FILTERS, defaultLimit: 20 });
  const { data, isLoading, isError, refetch } = useAdminPaymentStatuses(
    list.params
  );

  const fetchAll = useCallback(
    (limit: number) =>
      adminPaymentStatusesApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const typeOptions = (
    ["tours", "transfers", "quick", "insurance"] as const
  ).map((type) => ({ value: type, label: t(`paymentTypes.${type}`) }));

  const columns: DataColumn<PaymentStatusRow>[] = [
    {
      key: "type",
      header: t("common.type"),
      cell: (row) => (
        <Badge tone={TYPE_TONE[row.type]}>{t(`paymentTypes.${row.type}`)}</Badge>
      ),
    },
    {
      key: "customer",
      header: t("common.client"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{row.customer}</p>
          <p className="truncate text-xs text-gray-500" dir="ltr">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: t("common.amount"),
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.amount, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <PaymentStatusBadge status={row.status} />
          {row.reason && (
            <span className="max-w-[16rem] truncate text-xs text-red-600">
              {row.reason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "method",
      header: t("orders.paymentMethod"),
      cell: (row) => row.method || <span className="text-gray-300">—</span>,
    },
    {
      key: "orderId",
      header: t("orders.orderNumber"),
      cell: (row) => (
        <span className="text-xs text-gray-500" dir="ltr">
          {row.externalOrderId}
        </span>
      ),
    },
    {
      key: "date",
      header: t("common.date"),
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-500">
          {formatDateTime(row.date, locale)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.paymentStatuses")}
        description={t("orders.statusesSubtitle")}
        actions={
          <PrintButton
            onPrintAll={printAll}
            allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
          />
        }
      />

      <FilterBar
        activeCount={list.activeFilterCount}
        onReset={list.resetFilters}
        search={
          <SearchInput
            value={list.values.search}
            onChange={(v) => list.setFilter("search", v)}
            placeholder={t("orders.searchOrders")}
          />
        }
      >
        <SelectFilter
          label={t("common.type")}
          value={list.values.type}
          onChange={(v) => list.setFilter("type", v)}
          options={typeOptions}
        />
        <SelectFilter
          label={t("common.status")}
          value={list.values.status}
          onChange={(v) => list.setFilter("status", v)}
          options={statusOptions}
          allLabel={t("common.allStatuses")}
        />
        <DateRangeFilter
          label={t("orders.orderDate")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(from, to) => list.setFilters({ dateFrom: from, dateTo: to })}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? data?.data}
        rowKey={(row) => `${row.type}-${row.externalOrderId}`}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        filtered={list.activeFilterCount > 0}
        pagination={
          !printRows && (
            <Pagination
              meta={data?.meta}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
            />
          )
        }
      />
    </div>
  );
}
