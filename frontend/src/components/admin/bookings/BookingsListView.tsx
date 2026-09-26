"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
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
  useBookingSummary,
  useBookings,
  useDeleteBooking,
} from "@/src/hooks/admin/useBookings";
import { useHotelOptions } from "@/src/hooks/admin/useHotels";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { bookingsApi } from "@/src/services/admin/bookings.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import {
  formatDateOnly,
  formatNumber,
  fullName,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useRouter } from "@/src/i18n/routing";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  PAYMENT_STATES,
  type Booking,
} from "@/src/types/admin/bookings.types";
import { STATUS_TONE, bookingNumber } from "./BookingDetailView";
import { cn } from "@/src/utlis/cn";

const FILTERS = [
  "search",
  "type",
  "status",
  "paymentState",
  "currency",
  "hotelId",
  "driverId",
  "referrerId",
  "createdById",
  "source",
  "dateFrom",
  "dateTo",
] as const;

export default function BookingsListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({ filters: FILTERS, defaultSortBy: "startDate" });
  const { data, isLoading, isError, refetch } = useBookings(list.params);
  const summary = useBookingSummary(list.params);
  const deleteBooking = useDeleteBooking();

  const hotels = useHotelOptions(can("HOTELS"));
  const drivers = useDriverOptions();
  const partners = usePartnerOptions();
  const owners = useUsersLookup(
    true,
    canAll("BOOKINGS_HOTEL", "view") ||
      canAll("BOOKINGS_TOUR", "view") ||
      canAll("BOOKINGS_PACKAGE", "view")
  );

  const [toDelete, setToDelete] = useState<Booking | null>(null);

  const canCreate =
    can("BOOKINGS_HOTEL", "create") ||
    can("BOOKINGS_TOUR", "create") ||
    can("BOOKINGS_PACKAGE", "create");
  const canEdit =
    can("BOOKINGS_HOTEL", "edit") ||
    can("BOOKINGS_TOUR", "edit") ||
    can("BOOKINGS_PACKAGE", "edit");
  const canDelete =
    can("BOOKINGS_HOTEL", "delete") ||
    can("BOOKINGS_TOUR", "delete") ||
    can("BOOKINGS_PACKAGE", "delete");

  const fetchAll = useCallback(
    (limit: number) => bookingsApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteBooking.mutateAsync(toDelete.id);
      toast.success(t("bookings.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
      setToDelete(null);
    }
  };

  const money = (amount: number, currency: string) =>
    `${formatNumber(amount, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;

  const columns: DataColumn<Booking>[] = [
    {
      key: "number",
      header: t("bookings.number"),
      sortKey: "number",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-mono text-xs text-gray-500">
            {bookingNumber(row)}
          </p>
          <p className="truncate font-semibold text-gray-900">
            {row.touristName}
          </p>
          <p className="truncate text-xs text-gray-500">
            {t(`bookings.types.${row.type}`)}
            {row.source === "website" ? ` · ${t("bookings.fromWebsite")}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "dates",
      header: t("bookings.dates"),
      sortKey: "startDate",
      cell: (row) => (
        <div className="whitespace-nowrap text-sm text-gray-700">
          <p>{formatDateOnly(row.startDate, locale)}</p>
          {row.endDate && (
            <p className="text-xs text-gray-500">
              → {formatDateOnly(row.endDate, locale)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "services",
      header: t("bookings.items"),
      hideOnMobile: true,
      cell: (row) =>
        row.items.length ? (
          <div className="space-y-0.5">
            {row.items.slice(0, 2).map((item) => (
              <p key={item.id} className="truncate text-sm text-gray-700">
                {item.title}
              </p>
            ))}
            {row.items.length > 2 && (
              <p className="text-xs text-gray-400">
                {t("list.more", { count: row.items.length - 2 })}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "totalPrice",
      header: t("bookings.totalPrice"),
      sortKey: "totalPrice",
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {money(row.totalPrice, row.currency)}
        </span>
      ),
    },
    {
      key: "balanceDue",
      header: t("bookings.balanceDue"),
      align: "end",
      cell: (row) => (
        <span
          className={cn(
            "whitespace-nowrap font-semibold tabular-nums",
            row.balanceDue > 0 ? "text-amber-600" : "text-gray-400"
          )}
        >
          {money(row.balanceDue, row.currency)}
        </span>
      ),
    },
    {
      key: "profit",
      header: t("bookings.profit"),
      align: "end",
      hideOnMobile: true,
      cell: (row) => (
        <span
          className={cn(
            "whitespace-nowrap font-semibold tabular-nums",
            row.profit < 0 ? "text-red-600" : "text-brand-green"
          )}
        >
          {money(row.profit, row.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status]}>
          {t(`bookings.statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: "owner",
      header: t("common.owner"),
      hideOnMobile: true,
      cell: (row) =>
        row.createdBy ? (
          <span className="text-sm text-gray-600">
            {fullName(row.createdBy)}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
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
              key: "open",
              label: t("common.open"),
              icon: Eye,
              href: adminPaths.booking(row.id),
            },
            {
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              href: adminPaths.bookingEdit(row.id),
              hidden: !canEdit,
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !canDelete,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.bookings")}
        description={t("bookings.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {canCreate && (
              <Button onClick={() => router.push(adminPaths.bookingNew)}>
                <Plus />
                {t("bookings.new")}
              </Button>
            )}
          </>
        }
      />

      {/* Totals for the current filters, per currency */}
      {(summary.data ?? []).length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.data?.map((row) => (
            <div
              key={row.currency}
              data-print-card
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {row.currency}
                </p>
                <p className="text-xs text-gray-500">
                  {t("bookings.countLabel", { count: row.count })}
                </p>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-gray-500">{t("bookings.totalPrice")}</dt>
                <dd className="text-end font-semibold tabular-nums">
                  {money(row.totalPrice, row.currency)}
                </dd>
                <dt className="text-gray-500">{t("bookings.balanceDue")}</dt>
                <dd
                  className={cn(
                    "text-end font-semibold tabular-nums",
                    row.balanceDue > 0 ? "text-amber-600" : "text-gray-400"
                  )}
                >
                  {money(row.balanceDue, row.currency)}
                </dd>
                <dt className="text-gray-500">{t("bookings.profit")}</dt>
                <dd
                  className={cn(
                    "text-end font-semibold tabular-nums",
                    row.profit < 0 ? "text-red-600" : "text-brand-green"
                  )}
                >
                  {money(row.profit, row.currency)}
                </dd>
              </dl>
            </div>
          ))}
        </div>
      )}

      <FilterBar
        activeCount={list.activeFilterCount}
        onReset={list.resetFilters}
        search={
          <SearchInput
            value={list.values.search}
            onChange={(v) => list.setFilter("search", v)}
            placeholder={t("bookings.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("common.type")}
          value={list.values.type}
          onChange={(v) => list.setFilter("type", v)}
          options={BOOKING_TYPES.map((type) => ({
            value: type,
            label: t(`bookings.types.${type}`),
          }))}
        />
        <SelectFilter
          label={t("common.status")}
          value={list.values.status}
          onChange={(v) => list.setFilter("status", v)}
          options={BOOKING_STATUSES.map((status) => ({
            value: status,
            label: t(`bookings.statuses.${status}`),
          }))}
        />
        <SelectFilter
          label={t("bookings.payment")}
          value={list.values.paymentState}
          onChange={(v) => list.setFilter("paymentState", v)}
          options={PAYMENT_STATES.map((state) => ({
            value: state,
            label: t(`bookings.paymentStates.${state}`),
          }))}
        />
        <DateRangeFilter
          label={t("bookings.dates")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(from, to) =>
            list.setFilters({ dateFrom: from, dateTo: to })
          }
        />
        <SelectFilter
          label={t("hotels.currency")}
          value={list.values.currency}
          onChange={(v) => list.setFilter("currency", v)}
          options={CURRENCIES.map((currency) => ({
            value: currency,
            label: currency,
          }))}
        />
        {can("HOTELS") && (
          <SelectFilter
            label={t("nav.hotels")}
            value={list.values.hotelId}
            onChange={(v) => list.setFilter("hotelId", v)}
            options={(hotels.data ?? []).map((hotel) => ({
              value: hotel.id,
              label: hotel.name,
            }))}
          />
        )}
        <SelectFilter
          label={t("vehicles.driver")}
          value={list.values.driverId}
          onChange={(v) => list.setFilter("driverId", v)}
          options={(drivers.data ?? []).map((driver) => ({
            value: driver.id,
            label: fullName(driver),
          }))}
        />
        <SelectFilter
          label={t("bookings.referrer")}
          value={list.values.referrerId}
          onChange={(v) => list.setFilter("referrerId", v)}
          options={(partners.data ?? []).map((partner) => ({
            value: partner.id,
            label: partner.name,
          }))}
        />
        <SelectFilter
          label={t("bookings.source")}
          value={list.values.source}
          onChange={(v) => list.setFilter("source", v)}
          options={[
            { value: "manual", label: t("bookings.sources.manual") },
            { value: "website", label: t("bookings.sources.website") },
          ]}
        />
        {(canAll("BOOKINGS_HOTEL", "view") ||
          canAll("BOOKINGS_TOUR", "view") ||
          canAll("BOOKINGS_PACKAGE", "view")) && (
          <SelectFilter
            label={t("common.owner")}
            value={list.values.createdById}
            onChange={(v) => list.setFilter("createdById", v)}
            options={(owners.data ?? []).map((owner) => ({
              value: owner.id,
              label: fullName(owner),
            }))}
          />
        )}
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
        onRowClick={(row) => router.push(adminPaths.booking(row.id))}
        filtered={list.activeFilterCount > 0}
        rowClassName={(row) =>
          row.status === "CANCELLED" ? "opacity-60 line-through" : undefined
        }
        emptyAction={
          canCreate && list.activeFilterCount === 0 ? (
            <Button onClick={() => router.push(adminPaths.bookingNew)}>
              <Plus />
              {t("bookings.new")}
            </Button>
          ) : undefined
        }
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("bookings.deleteTitle")}
        description={t("bookings.deleteText", {
          number: toDelete ? bookingNumber(toDelete) : "",
        })}
        loading={deleteBooking.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
