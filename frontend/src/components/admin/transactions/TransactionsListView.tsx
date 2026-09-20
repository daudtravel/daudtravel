"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Car,
  Pencil,
  Plus,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import StatCard from "@/src/components/admin/common/StatCard";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DateRangeFilter from "@/src/components/admin/list/DateRangeFilter";
import NumberRangeFilter from "@/src/components/admin/list/NumberRangeFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import {
  useDeleteTransaction,
  useTransactionSummary,
  useTransactions,
} from "@/src/hooks/admin/useTransactions";
import { useVehicleOptions } from "@/src/hooks/admin/useVehicles";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useHotelOptions } from "@/src/hooks/admin/useHotels";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { transactionsApi } from "@/src/services/admin/transactions.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import {
  formatDateOnly,
  formatNumber,
  fullName,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { adminPaths } from "@/src/utlis/admin/paths";
import { Link } from "@/src/i18n/routing";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import {
  TRANSACTION_CATEGORIES,
  type Transaction,
  type TransactionType,
} from "@/src/types/admin/transactions.types";
import TransactionFormDialog from "./TransactionFormDialog";
import { cn } from "@/src/utlis/cn";

const FILTERS = [
  "search",
  "categories",
  "currency",
  "vehicleId",
  "driverId",
  "hotelId",
  "employeeId",
  "createdById",
  "dateFrom",
  "dateTo",
  "minAmount",
  "maxAmount",
] as const;

const TABS: (TransactionType | "ALL")[] = ["ALL", "EXPENSE", "INCOME"];

export default function TransactionsListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const [tab, setTab] = useState<TransactionType | "ALL">("ALL");
  const fixed = useMemo(
    () => ({ type: tab === "ALL" ? undefined : tab }),
    [tab]
  );
  const list = useListQuery({ filters: FILTERS, defaultSortBy: "date", fixed });
  const { data, isLoading, isError, refetch } = useTransactions(list.params);
  const summary = useTransactionSummary(list.params);
  const deleteTransaction = useDeleteTransaction();

  const vehicles = useVehicleOptions(undefined, can("DRIVERS"));
  const drivers = useDriverOptions(can("DRIVERS"));
  const hotels = useHotelOptions(can("HOTELS"));
  const employees = useUsersLookup(true, true);
  const owners = useUsersLookup(true, canAll("TRANSACTIONS", "view"));

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  /** "Add expense" links from a driver, vehicle, hotel or booking page. */
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const prefill: Record<string, string> = {};
    for (const key of [
      "vehicleId",
      "driverId",
      "hotelId",
      "bookingId",
      "partnerId",
    ]) {
      const value = searchParams.get(key);
      if (value) prefill[key] = value;
    }
    const type = searchParams.get("type");
    if (type === "INCOME" || type === "EXPENSE") prefill.type = type;
    const category = searchParams.get("category");
    if (category) prefill.category = category;
    setDefaults(prefill);
    setEditing(null);
    setFormOpen(true);
  }, [searchParams]);

  const fetchAll = useCallback(
    (limit: number) => transactionsApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const openCreate = () => {
    setEditing(null);
    setDefaults(tab === "INCOME" ? { type: "INCOME" } : { type: "EXPENSE" });
    setFormOpen(true);
  };
  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTransaction.mutateAsync(toDelete.id);
      toast.success(t("transactions.deleted"));
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

  const columns: DataColumn<Transaction>[] = [
    {
      key: "date",
      header: t("common.date"),
      sortKey: "date",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-700">
          {formatDateOnly(row.date, locale)}
        </span>
      ),
    },
    {
      key: "title",
      header: t("transactions.title"),
      sortKey: "title",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{row.title}</p>
          <p className="truncate text-xs text-gray-500">
            {t(`transactions.categories.${row.category}`)}
            {row.paymentMethod ? ` · ${row.paymentMethod}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "links",
      header: t("transactions.linkedTo"),
      hideOnMobile: true,
      cell: (row) => (
        <div className="space-y-0.5 text-xs text-gray-600">
          {row.vehicle && (
            <p className="flex items-center gap-1">
              <Car className="h-3 w-3 text-gray-400" />
              {row.vehicle.brand} {row.vehicle.model}
            </p>
          )}
          {row.driver && (
            <p className="flex items-center gap-1">
              <User className="h-3 w-3 text-gray-400" />
              {fullName(row.driver)}
            </p>
          )}
          {row.hotel && (
            <p className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-gray-400" />
              {row.hotel.name}
            </p>
          )}
          {row.employee && (
            <p className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-gray-400" />
              {fullName(row.employee)}
            </p>
          )}
          {row.booking && (
            <Link
              href={adminPaths.booking(row.booking.id)}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-brand-green hover:underline"
            >
              BK-{String(row.booking.number).padStart(6, "0")}
            </Link>
          )}
          {!row.vehicle &&
            !row.driver &&
            !row.hotel &&
            !row.employee &&
            !row.booking && <span className="text-gray-300">—</span>}
        </div>
      ),
    },
    {
      key: "amount",
      header: t("common.amount"),
      sortKey: "amount",
      align: "end",
      cell: (row) => (
        <div className="whitespace-nowrap">
          <p
            className={cn(
              "font-semibold tabular-nums",
              row.type === "INCOME" ? "text-brand-green" : "text-gray-900"
            )}
          >
            {row.type === "INCOME" ? "+" : "−"}
            {money(row.amount, row.currency)}
          </p>
          {row.currency !== "GEL" && (
            <p className="text-xs text-gray-500 tabular-nums">
              ≈ {money(row.amountGel, "GEL")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: t("common.type"),
      cell: (row) => (
        <Badge tone={row.type === "INCOME" ? "green" : "neutral"}>
          {t(`transactions.types.${row.type}`)}
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
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              onSelect: () => openEdit(row),
              hidden: !can("TRANSACTIONS", "edit"),
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("TRANSACTIONS", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  const totals = summary.data?.totalsGel;

  return (
    <div>
      <PageHeader
        title={t("nav.transactions")}
        description={t("transactions.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("TRANSACTIONS", "create") && (
              <Button onClick={openCreate}>
                <Plus />
                {t("transactions.new")}
              </Button>
            )}
          </>
        }
      />

      {/* Totals for the current filters, converted with the stored rates */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("transactions.totalIncome")}
          value={money(totals?.income ?? 0, "GEL")}
          icon={ArrowUpCircle}
          tone="green"
        />
        <StatCard
          label={t("transactions.totalExpense")}
          value={money(totals?.expense ?? 0, "GEL")}
          icon={ArrowDownCircle}
          tone="red"
        />
        <StatCard
          label={t("transactions.net")}
          value={money(totals?.net ?? 0, "GEL")}
          hint={t("transactions.netHint")}
          icon={Wallet}
          tone={(totals?.net ?? 0) < 0 ? "red" : "green"}
        />
      </div>

      {/* All / expenses / income */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 print:hidden">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            aria-current={tab === name}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === name
                ? "bg-white text-brand-green shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {name === "ALL" ? t("common.all") : t(`transactions.types.${name}`)}
          </button>
        ))}
      </div>

      <FilterBar
        activeCount={list.activeFilterCount}
        onReset={list.resetFilters}
        search={
          <SearchInput
            value={list.values.search}
            onChange={(v) => list.setFilter("search", v)}
            placeholder={t("transactions.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("common.category")}
          value={list.values.categories}
          onChange={(v) => list.setFilter("categories", v)}
          options={TRANSACTION_CATEGORIES.filter(
            (category) =>
              tab === "ALL" ||
              (tab === "INCOME"
                ? category.includes("INCOME") || category === "HOTEL_COMMISSION"
                : !category.includes("INCOME") &&
                  category !== "HOTEL_COMMISSION")
          ).map((category) => ({
            value: category,
            label: t(`transactions.categories.${category}`),
          }))}
        />
        <DateRangeFilter
          label={t("common.date")}
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
        {can("DRIVERS") && (
          <SelectFilter
            label={t("vehicles.vehicle")}
            value={list.values.vehicleId}
            onChange={(v) => list.setFilter("vehicleId", v)}
            options={(vehicles.data ?? []).map((vehicle) => ({
              value: vehicle.id,
              label: `${vehicle.brand} ${vehicle.model}`,
            }))}
          />
        )}
        {can("DRIVERS") && (
          <SelectFilter
            label={t("vehicles.driver")}
            value={list.values.driverId}
            onChange={(v) => list.setFilter("driverId", v)}
            options={(drivers.data ?? []).map((driver) => ({
              value: driver.id,
              label: fullName(driver),
            }))}
          />
        )}
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
          label={t("transactions.employee")}
          value={list.values.employeeId}
          onChange={(v) => list.setFilter("employeeId", v)}
          options={(employees.data ?? []).map((employee) => ({
            value: employee.id,
            label: fullName(employee),
          }))}
        />
        <NumberRangeFilter
          label={t("common.amount")}
          min={list.values.minAmount}
          max={list.values.maxAmount}
          onChange={(min, max) =>
            list.setFilters({ minAmount: min, maxAmount: max })
          }
        />
        {canAll("TRANSACTIONS", "view") && (
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
        onRowClick={can("TRANSACTIONS", "edit") ? openEdit : undefined}
        filtered={list.activeFilterCount > 0}
        emptyAction={
          can("TRANSACTIONS", "create") && list.activeFilterCount === 0 ? (
            <Button onClick={openCreate}>
              <Plus />
              {t("transactions.new")}
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

      {/* Where the money went, for the filters in use */}
      {(summary.data?.byCategory.length ?? 0) > 0 && (
        <div
          data-print-card
          className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-3 text-base font-bold text-gray-900">
            {t("transactions.byCategory")}
          </h2>
          <ul className="space-y-2">
            {summary.data?.byCategory.slice(0, 10).map((row) => {
              const max = summary.data?.byCategory[0]?.amount || 1;
              return (
                <li key={row.category} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-sm text-gray-700">
                    {t(`transactions.categories.${row.category}`)}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full bg-brand-green"
                      style={{
                        width: `${Math.max(2, (row.amount / max) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-28 shrink-0 text-end text-sm font-semibold tabular-nums">
                    {formatNumber(row.amount, locale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TransactionFormDialog
        open={formOpen}
        transaction={editing}
        defaults={defaults}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("transactions.deleteTitle")}
        description={t("transactions.deleteText", {
          title: toDelete?.title ?? "",
        })}
        loading={deleteTransaction.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
