"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
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
import {
  useAdminPaymentLinks,
  useAdminQuickOrders,
  useDeleteQuickOrder,
} from "@/src/hooks/admin/useAdminLists";
import { adminQuickOrdersApi } from "@/src/services/admin/orders.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatDate, formatDateTime, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { QuickOrderRow } from "@/src/types/admin/orders.types";
import OrderDetailsDialog from "./OrderDetailsDialog";

const FILTERS = ["search", "status", "linkId", "dateFrom", "dateTo"] as const;

export default function QuickOrdersView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();
  const statusOptions = usePaymentStatusOptions();

  const list = useListQuery({ filters: FILTERS });
  const { data, isLoading, isError, refetch } = useAdminQuickOrders(list.params);
  const links = useAdminPaymentLinks({ page: 1, limit: 100, locale });
  const deleteOrder = useDeleteQuickOrder();
  const [details, setDetails] = useState<QuickOrderRow | null>(null);
  const [toDelete, setToDelete] = useState<QuickOrderRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminQuickOrdersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteOrder.mutateAsync(toDelete.id);
      toast.success(t("common.orderDeleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<QuickOrderRow>[] = [
    {
      key: "customer",
      header: t("common.client"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {row.customerFullName}
          </p>
          <p className="truncate text-xs text-gray-500" dir="ltr">
            {row.customerEmail}
          </p>
        </div>
      ),
    },
    {
      key: "product",
      header: t("common.product"),
      cell: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-gray-800">{row.productName}</p>
          <p className="text-xs text-gray-500">
            {row.productQuantity} ×{" "}
            {formatMoney(row.productUnitPrice, "GEL", locale)}
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
          {formatMoney(row.productTotalPrice, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: t("common.date"),
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-500">
          {formatDate(row.createdAt, locale)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("list.actions")}</span>,
      mobileLabel: t("list.actions"),
      align: "end",
      hideOnPrint: true,
      cell: (row) => (
        <RowActions
          actions={[
            {
              key: "details",
              label: t("common.details"),
              icon: Eye,
              onSelect: () => setDetails(row),
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              // Paid orders are financial records and stay
              hidden: !can("ONLINE_ORDERS", "delete") || row.status === "PAID",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.paymentLinkOrders")}
        description={t("orders.quickOrdersSubtitle")}
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
          label={t("common.status")}
          value={list.values.status}
          onChange={(v) => list.setFilter("status", v)}
          options={statusOptions}
          allLabel={t("common.allStatuses")}
        />
        <SelectFilter
          label={t("nav.paymentLinks")}
          value={list.values.linkId}
          onChange={(v) => list.setFilter("linkId", v)}
          options={(links.data?.data ?? []).map((link) => ({
            value: link.id,
            label: link.name,
          }))}
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
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onRowClick={(row) => setDetails(row)}
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

      <OrderDetailsDialog
        open={!!details}
        onOpenChange={(open) => !open && setDetails(null)}
        title={details?.productName ?? ""}
        subtitle={
          details ? t("common.orderId", { id: details.externalOrderId }) : ""
        }
        sections={
          details
            ? [
                {
                  title: t("common.client"),
                  rows: [
                    { label: t("users.name"), value: details.customerFullName },
                    { label: t("users.email"), value: details.customerEmail },
                    {
                      label: t("users.phone"),
                      value: details.customerPhone,
                      hidden: !details.customerPhone,
                    },
                  ],
                },
                {
                  title: t("common.payment"),
                  rows: [
                    {
                      label: t("common.price"),
                      value: formatMoney(details.productUnitPrice, "GEL", locale),
                    },
                    {
                      label: t("quickOrders.quantity"),
                      value: details.productQuantity,
                    },
                    {
                      label: t("common.amount"),
                      value: formatMoney(
                        details.productTotalPrice,
                        "GEL",
                        locale
                      ),
                    },
                    {
                      label: t("common.status"),
                      value: <PaymentStatusBadge status={details.status} />,
                    },
                    {
                      label: t("orders.paymentMethod"),
                      value: details.paymentMethod,
                      hidden: !details.paymentMethod,
                    },
                    {
                      label: t("common.viewReason"),
                      value: details.failureReason,
                      hidden: !details.failureReason,
                      full: true,
                    },
                    {
                      label: t("tourOrders.ordered"),
                      value: formatDateTime(details.createdAt, locale),
                    },
                    {
                      label: t("orders.paidAt"),
                      value: details.paidAt
                        ? formatDateTime(details.paidAt, locale)
                        : "—",
                    },
                  ],
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("common.deleteOrder")}
        description={t("common.confirmIrreversible")}
        loading={deleteOrder.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
