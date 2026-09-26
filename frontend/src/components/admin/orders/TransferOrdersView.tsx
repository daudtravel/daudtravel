"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
  useAdminTransferOrders,
  useDeleteExpiredTransferOrders,
  useDeleteFailedTransferOrders,
  useDriverOptions,
} from "@/src/hooks/admin/useAdminLists";
import { adminTransferOrdersApi } from "@/src/services/admin/orders.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useLinkedOrders } from "@/src/hooks/admin/useBookings";
import { adminPaths } from "@/src/utlis/admin/paths";
import { Link } from "@/src/i18n/routing";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  fullName,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { TransferOrderRow } from "@/src/types/admin/orders.types";
import OrderDetailsDialog from "./OrderDetailsDialog";
import AssignDriverDialog from "./AssignDriverDialog";

const FILTERS = [
  "search",
  "status",
  "vehicleType",
  "driverId",
  "dateFrom",
  "dateTo",
  "serviceFrom",
  "serviceTo",
] as const;

const VEHICLE_TYPES = ["SEDAN", "MINIVAN", "VITO", "SPRINTER", "BUS"] as const;

const timeOf = (iso: string) => iso?.slice(11, 16) ?? "";

export default function TransferOrdersView() {
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
  const { data, isLoading, isError, refetch } = useAdminTransferOrders(
    list.params
  );
  // Which of these orders already became a booking
  const canBook = can("BOOKINGS_TOUR", "create");
  const linked = useLinkedOrders(canBook || can("BOOKINGS_TOUR"));
  const drivers = useDriverOptions();
  const deleteFailed = useDeleteFailedTransferOrders();
  const deleteExpired = useDeleteExpiredTransferOrders();
  const [details, setDetails] = useState<TransferOrderRow | null>(null);
  const [assignTo, setAssignTo] = useState<TransferOrderRow | null>(null);
  const [cleanup, setCleanup] = useState<"failed" | "expired" | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminTransferOrdersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const runCleanup = async () => {
    try {
      if (cleanup === "failed") await deleteFailed.mutateAsync(undefined);
      else await deleteExpired.mutateAsync(undefined);
      toast.success(t("common.failedOrdersDeleted"));
      setCleanup(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<TransferOrderRow>[] = [
    {
      key: "customer",
      header: t("common.client"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {row.customer.fullName}
          </p>
          <p className="truncate text-xs text-gray-500" dir="ltr">
            {row.customer.email}
          </p>
        </div>
      ),
    },
    {
      key: "route",
      header: t("transfers.route"),
      cell: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-gray-800">
            {row.startLocation}
            <ArrowRight className="h-3 w-3 shrink-0 text-gray-400 rtl:rotate-180" />
            {row.endLocation}
          </p>
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <span>{t(`vehicles.${row.transfer.vehicleType}`)}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {row.transfer.passengerCount}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "when",
      header: t("transferOrders.transferDate"),
      sortKey: "transferDate",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">
          {formatDate(row.transfer.date, locale)}
          <span className="ms-1 text-gray-500">
            {timeOf(row.transfer.time)}
          </span>
        </span>
      ),
    },
    {
      key: "driver",
      header: t("transferOrders.driver"),
      cell: (row) =>
        row.driver ? (
          <Badge tone="green">{fullName(row.driver)}</Badge>
        ) : (
          <span className="text-xs text-gray-400">
            {t("transferOrders.noDriver")}
          </span>
        ),
    },
    {
      key: "amount",
      header: t("common.amount"),
      sortKey: "paymentAmount",
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.paymentAmount, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      sortKey: "status",
      cell: (row) => (
        <div className="space-y-1">
          <PaymentStatusBadge status={row.status} />
          {linked.data?.transferOrders[row.id] && (
            <Link
              href={adminPaths.booking(linked.data.transferOrders[row.id].id)}
              onClick={(e) => e.stopPropagation()}
              className="block text-xs font-semibold text-brand-green hover:underline"
            >
              BK-
              {String(linked.data.transferOrders[row.id].number).padStart(
                6,
                "0"
              )}
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
              key: "driver",
              label: t("transferOrders.assignDriver"),
              icon: UserCog,
              onSelect: () => setAssignTo(row),
              hidden: !can("ONLINE_ORDERS", "edit"),
            },
            {
              key: "booking",
              label: linked.data?.transferOrders[row.id]
                ? t("bookings.openBooking")
                : t("bookings.createFromOrder"),
              icon: ClipboardList,
              href: linked.data?.transferOrders[row.id]
                ? adminPaths.booking(linked.data.transferOrders[row.id].id)
                : adminPaths.bookingFromOrder("TRANSFER", row.id),
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
        title={t("nav.transferOrders")}
        description={t("orders.transferOrdersSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("ONLINE_ORDERS", "delete") && (
              <>
                <Button variant="outline" onClick={() => setCleanup("expired")}>
                  <Trash2 />
                  {t("transferOrders.deleteExpired")}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setCleanup("failed")}
                >
                  <Trash2 />
                  {t("common.deleteFailedOrders")}
                </Button>
              </>
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
        <SelectFilter
          label={t("website.vehicleType")}
          value={list.values.vehicleType}
          onChange={(v) => list.setFilter("vehicleType", v)}
          options={VEHICLE_TYPES.map((type) => ({
            value: type,
            label: t(`vehicles.${type}`),
          }))}
        />
        <SelectFilter
          label={t("transferOrders.driver")}
          value={list.values.driverId}
          onChange={(v) => list.setFilter("driverId", v)}
          options={(drivers.data ?? []).map((driver) => ({
            value: driver.id,
            label: fullName(driver),
          }))}
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
          label={t("transferOrders.transferDate")}
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
        title={details?.route ?? ""}
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
                      value: details.customer.fullName,
                    },
                    { label: t("users.email"), value: details.customer.email },
                    { label: t("users.phone"), value: details.customer.phone },
                  ],
                },
                {
                  title: t("nav.websiteTransfers"),
                  rows: [
                    {
                      label: t("transferOrders.transferDate"),
                      value: `${formatDate(details.transfer.date, locale)} ${timeOf(details.transfer.time)}`,
                    },
                    {
                      label: t("website.vehicleType"),
                      value: t(`vehicles.${details.transfer.vehicleType}`),
                    },
                    {
                      label: t("common.peopleCount"),
                      value: details.transfer.passengerCount,
                    },
                    {
                      label: t("transferOrders.driver"),
                      value: details.driver
                        ? fullName(details.driver)
                        : t("transferOrders.noDriver"),
                    },
                  ],
                },
                {
                  title: t("common.payment"),
                  rows: [
                    {
                      label: t("common.amount"),
                      value: formatMoney(details.paymentAmount, "GEL", locale),
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
        footer={
          details && can("ONLINE_ORDERS", "edit") ? (
            <Button
              variant="outline"
              onClick={() => {
                setAssignTo(details);
                setDetails(null);
              }}
            >
              <UserCog />
              {t("transferOrders.assignDriver")}
            </Button>
          ) : null
        }
      />

      <AssignDriverDialog
        order={assignTo}
        onOpenChange={(open) => !open && setAssignTo(null)}
      />

      <ConfirmDialog
        open={!!cleanup}
        onOpenChange={(open) => !open && setCleanup(null)}
        title={
          cleanup === "expired"
            ? t("transferOrders.deleteExpiredTitle")
            : t("common.deleteFailedOrdersTitle")
        }
        description={t("common.confirmIrreversible")}
        loading={deleteFailed.isPending || deleteExpired.isPending}
        onConfirm={() => void runCleanup()}
      />
    </div>
  );
}
