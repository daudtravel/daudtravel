"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Eye, Trash2, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
  useAdminTourOrders,
  useDeleteFailedTourOrders,
} from "@/src/hooks/admin/useAdminLists";
import { adminTourOrdersApi } from "@/src/services/admin/orders.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useLinkedOrders } from "@/src/hooks/admin/useBookings";
import { adminPaths } from "@/src/utlis/admin/paths";
import { Link } from "@/src/i18n/routing";
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { TourOrderRow } from "@/src/types/admin/orders.types";
import OrderDetailsDialog from "./OrderDetailsDialog";

const FILTERS = [
  "search",
  "status",
  "dateFrom",
  "dateTo",
  "serviceFrom",
  "serviceTo",
] as const;

export default function TourOrdersView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();
  const statusOptions = usePaymentStatusOptions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const { data, isLoading, isError, refetch } = useAdminTourOrders(list.params);
  // Which of these orders already became a booking
  const canBook = can("BOOKINGS_TOUR", "create");
  const linked = useLinkedOrders(canBook || can("BOOKINGS_TOUR"));
  const deleteFailed = useDeleteFailedTourOrders();
  const [details, setDetails] = useState<TourOrderRow | null>(null);
  const [confirmCleanup, setConfirmCleanup] = useState(false);

  const fetchAll = useCallback(
    (limit: number) =>
      adminTourOrdersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const cleanup = async () => {
    try {
      await deleteFailed.mutateAsync(undefined);
      toast.success(t("common.failedOrdersDeleted"));
      setConfirmCleanup(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<TourOrderRow>[] = [
    {
      key: "customer",
      header: t("common.client"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {row.customerFirstName}
          </p>
          <p className="truncate text-xs text-gray-500" dir="ltr">
            {row.customerEmail}
          </p>
        </div>
      ),
    },
    {
      key: "tour",
      header: t("tourOrders.tour"),
      cell: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-gray-800">{row.tourName}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            {row.peopleAmount}
          </p>
        </div>
      ),
    },
    {
      key: "selectedDate",
      header: t("tourOrders.tourDate"),
      sortKey: "selectedDate",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">
          {formatDate(row.selectedDate, locale)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("common.amount"),
      sortKey: "paidAmount",
      align: "end",
      cell: (row) => (
        <div className="whitespace-nowrap text-end">
          <p className="font-semibold tabular-nums">
            {formatMoney(row.amountPaid, "GEL", locale)}
          </p>
          {row.amountRemaining ? (
            <p className="text-xs text-gray-500">
              {t("tourOrders.remaining", {
                amount: formatMoney(row.amountRemaining, "GEL", locale),
              })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      sortKey: "status",
      cell: (row) => (
        <div className="space-y-1">
          <PaymentStatusBadge status={row.status} />
          {linked.data?.tourOrders[row.id] && (
            <Link
              href={adminPaths.booking(linked.data.tourOrders[row.id].id)}
              onClick={(e) => e.stopPropagation()}
              className="block text-xs font-semibold text-brand-green hover:underline"
            >
              BK-
              {String(linked.data.tourOrders[row.id].number).padStart(6, "0")}
            </Link>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("tourOrders.ordered"),
      sortKey: "createdAt",
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
              key: "booking",
              label: linked.data?.tourOrders[row.id]
                ? t("bookings.openBooking")
                : t("bookings.createFromOrder"),
              icon: ClipboardList,
              href: linked.data?.tourOrders[row.id]
                ? adminPaths.booking(linked.data.tourOrders[row.id].id)
                : adminPaths.bookingFromOrder("TOUR", row.id),
              hidden: !canBook || row.status !== "PAID",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.tourOrders")}
        description={t("orders.tourOrdersSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("ONLINE_ORDERS", "delete") && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmCleanup(true)}
              >
                <Trash2 />
                {t("common.deleteFailedOrders")}
              </Button>
            )}
          </>
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
        <DateRangeFilter
          label={t("orders.orderDate")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(from, to) =>
            list.setFilters({ dateFrom: from, dateTo: to })
          }
        />
        <DateRangeFilter
          label={t("tourOrders.tourDate")}
          from={list.values.serviceFrom}
          to={list.values.serviceTo}
          onChange={(from, to) =>
            list.setFilters({ serviceFrom: from, serviceTo: to })
          }
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? data?.data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={(field) => list.toggleSort(field)}
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
        title={details?.tourName ?? ""}
        subtitle={
          details ? t("common.orderId", { id: details.externalOrderId }) : ""
        }
        sections={
          details
            ? [
                {
                  title: t("common.client"),
                  rows: [
                    {
                      label: t("users.name"),
                      value: details.customerFirstName,
                    },
                    { label: t("users.email"), value: details.customerEmail },
                    { label: t("users.phone"), value: details.customerPhone },
                    {
                      label: t("common.peopleCount"),
                      value: details.peopleAmount,
                    },
                  ],
                },
                {
                  title: t("tourOrders.tour"),
                  rows: [
                    {
                      label: t("tourOrders.tourDate"),
                      value: formatDate(details.selectedDate, locale),
                    },
                    {
                      label: t("common.duration"),
                      value: `${t("common.days", { count: details.tourDurationDays })}${
                        details.tourDurationNights
                          ? ` / ${t("common.nights", { count: details.tourDurationNights })}`
                          : ""
                      }`,
                    },
                    {
                      label: t("tours.colStartLocation"),
                      value: details.startLocation,
                      hidden: !details.startLocation,
                    },
                    {
                      label: t("transfers.endLocation"),
                      value: details.endLocation,
                      hidden: !details.endLocation,
                    },
                  ],
                },
                {
                  title: t("common.payment"),
                  rows: [
                    {
                      label: t("tourOrders.totalPrice"),
                      value: formatMoney(details.totalTourPrice, "GEL", locale),
                    },
                    {
                      label: t("tourOrders.paid"),
                      value: formatMoney(details.amountPaid, "GEL", locale),
                    },
                    {
                      label: t("tourOrders.remainingLabel"),
                      value: details.amountRemaining
                        ? formatMoney(details.amountRemaining, "GEL", locale)
                        : "—",
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
                      value: details.rejectionReason,
                      hidden: !details.rejectionReason,
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
        open={confirmCleanup}
        onOpenChange={setConfirmCleanup}
        title={t("common.deleteFailedOrdersTitle")}
        description={t("common.confirmIrreversible")}
        loading={deleteFailed.isPending}
        onConfirm={() => void cleanup()}
      />
    </div>
  );
}
