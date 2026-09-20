"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Car,
  Globe,
  Handshake,
  PiggyBank,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import Panel from "@/src/components/admin/common/Panel";
import StatCard from "@/src/components/admin/common/StatCard";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DateRangeFilter from "@/src/components/admin/list/DateRangeFilter";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { useFinanceReport } from "@/src/hooks/admin/useFinance";
import { useVehicleOptions } from "@/src/hooks/admin/useVehicles";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useHotelOptions } from "@/src/hooks/admin/useHotels";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatNumber, fullName } from "@/src/utlis/admin/format";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import { BOOKING_TYPES } from "@/src/types/admin/bookings.types";
import { cn } from "@/src/utlis/cn";

const FILTERS = [
  "dateFrom",
  "dateTo",
  "displayCurrency",
  "bookingType",
  "vehicleId",
  "driverId",
  "hotelId",
  "partnerId",
  "createdById",
] as const;

/** A row with a proportional bar; prints as a bar too. */
function BarRow({
  label,
  value,
  max,
  tone = "green",
  suffix,
}: {
  label: React.ReactNode;
  value: number;
  max: number;
  tone?: "green" | "red";
  suffix?: React.ReactNode;
}) {
  const width = max > 0 ? Math.max(2, (Math.abs(value) / max) * 100) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-gray-700">
        {label}
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "red" ? "bg-red-400" : "bg-brand-green"
          )}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-32 shrink-0 text-end text-sm font-semibold tabular-nums">
        {suffix}
      </span>
    </li>
  );
}

export default function FinanceReportView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { can, canAll } = usePermissions();

  const list = useListQuery({ filters: FILTERS });
  // The report is not a paginated list, so only the filters are sent
  const params = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(list.values).filter(([, value]) => value !== "")
      ),
    [list.values]
  );
  const { data, isLoading, isError, refetch } = useFinanceReport(params);

  const vehicles = useVehicleOptions(undefined, can("DRIVERS"));
  const drivers = useDriverOptions(can("DRIVERS"));
  const hotels = useHotelOptions(can("HOTELS"));
  const partners = usePartnerOptions(can("PARTNERS"));
  const owners = useUsersLookup(true, canAll("FINANCE", "view"));

  const currency = data?.displayCurrency ?? "GEL";
  const money = (amount: number) =>
    `${formatNumber(amount, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    });
    return (month: string) => {
      const [year, m] = month.split("-").map(Number);
      return formatter.format(new Date(year, m - 1, 1));
    };
  }, [locale]);

  const monthlyMax = Math.max(
    1,
    ...(data?.monthly.flatMap((row) => [row.revenue, row.expenses]) ?? [0])
  );

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("nav.finance")}
        description={t("finance.subtitle")}
        printFilters={
          data?.period.from || data?.period.to
            ? `${data?.period.from ?? "…"} — ${data?.period.to ?? "…"}`
            : undefined
        }
        actions={<PrintButton />}
      />

      <FilterBar
        activeCount={list.activeFilterCount}
        onReset={list.resetFilters}
      >
        <DateRangeFilter
          label={t("finance.period")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(from, to) =>
            list.setFilters({ dateFrom: from, dateTo: to })
          }
        />
        <SelectFilter
          label={t("finance.displayCurrency")}
          value={list.values.displayCurrency}
          onChange={(v) => list.setFilter("displayCurrency", v)}
          allLabel="GEL"
          options={CURRENCIES.filter((code) => code !== "GEL").map((code) => ({
            value: code,
            label: code,
          }))}
        />
        <SelectFilter
          label={t("bookings.booking")}
          value={list.values.bookingType}
          onChange={(v) => list.setFilter("bookingType", v)}
          options={BOOKING_TYPES.map((type) => ({
            value: type,
            label: t(`bookings.types.${type}`),
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
        {can("PARTNERS") && (
          <SelectFilter
            label={t("nav.partners")}
            value={list.values.partnerId}
            onChange={(v) => list.setFilter("partnerId", v)}
            options={(partners.data ?? []).map((partner) => ({
              value: partner.id,
              label: partner.name,
            }))}
          />
        )}
        {canAll("FINANCE", "view") && (
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

      {isError && (
        <Panel>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600">{t("list.loadError")}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm font-semibold text-brand-green hover:underline"
            >
              {t("list.retry")}
            </button>
          </div>
        </Panel>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("finance.revenue")}
              value={money(data.kpis.revenue)}
              hint={t("finance.bookingsCount", { count: data.kpis.bookings })}
              icon={TrendingUp}
            />
            <StatCard
              label={t("finance.costOfSales")}
              value={money(data.kpis.costOfSales)}
              icon={Receipt}
              tone="neutral"
            />
            <StatCard
              label={t("finance.commissions")}
              value={money(data.kpis.commissions)}
              icon={Handshake}
              tone="yellow"
            />
            <StatCard
              label={t("finance.bookingProfit")}
              value={money(data.kpis.bookingProfit)}
              hint={t("finance.bookingProfitHint")}
              icon={PiggyBank}
              tone={data.kpis.bookingProfit < 0 ? "red" : "green"}
            />
            <StatCard
              label={t("finance.onlineIncome")}
              value={money(data.kpis.onlineIncome)}
              hint={t("finance.onlineIncomeHint")}
              icon={Globe}
              tone="blue"
            />
            <StatCard
              label={t("finance.otherIncome")}
              value={money(data.kpis.otherIncome)}
              icon={ArrowUpCircle}
            />
            <StatCard
              label={t("finance.expenses")}
              value={money(data.kpis.expenses)}
              icon={ArrowDownCircle}
              tone="red"
            />
            <StatCard
              label={t("finance.netResult")}
              value={money(data.kpis.netResult)}
              hint={t("finance.netResultHint")}
              icon={Wallet}
              tone={data.kpis.netResult < 0 ? "red" : "green"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label={t("finance.received")}
              value={money(data.kpis.received)}
              icon={ArrowUpCircle}
              tone="green"
            />
            <StatCard
              label={t("finance.outstanding")}
              value={money(data.kpis.outstanding)}
              hint={t("finance.outstandingHint")}
              icon={ArrowDownCircle}
              tone="yellow"
            />
          </div>

          {data.monthly.length > 0 && (
            <Panel title={t("finance.monthly")}>
              <ul className="space-y-3">
                {data.monthly.map((row) => (
                  <li key={row.month}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        {monthNames(row.month)}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          row.profit < 0 ? "text-red-600" : "text-brand-green"
                        )}
                      >
                        {money(row.profit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-gray-500">
                        {t("transactions.totalIncome")}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span
                          className="block h-full rounded-full bg-brand-green"
                          style={{
                            width: `${Math.max(1, (row.revenue / monthlyMax) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="w-28 shrink-0 text-end text-xs tabular-nums text-gray-600">
                        {money(row.revenue)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-gray-500">
                        {t("transactions.totalExpense")}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span
                          className="block h-full rounded-full bg-red-400"
                          style={{
                            width: `${Math.max(1, (row.expenses / monthlyMax) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="w-28 shrink-0 text-end text-xs tabular-nums text-gray-600">
                        {money(row.expenses)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.byItemType.length > 0 && (
              <Panel
                title={t("finance.byItemType")}
                description={t("finance.byItemTypeHint")}
              >
                <ul className="space-y-2">
                  {data.byItemType.map((row) => (
                    <BarRow
                      key={row.type}
                      label={t(`bookings.itemTypes.${row.type}`)}
                      value={row.profit}
                      max={Math.max(
                        ...data.byItemType.map((r) => Math.abs(r.profit)),
                        1
                      )}
                      tone={row.profit < 0 ? "red" : "green"}
                      suffix={money(row.profit)}
                    />
                  ))}
                </ul>
              </Panel>
            )}

            {data.expensesByCategory.length > 0 && (
              <Panel title={t("transactions.byCategory")}>
                <ul className="space-y-2">
                  {data.expensesByCategory.map((row) => (
                    <BarRow
                      key={row.category}
                      label={t(`transactions.categories.${row.category}`)}
                      value={row.amount}
                      max={data.expensesByCategory[0]?.amount ?? 1}
                      tone="red"
                      suffix={money(row.amount)}
                    />
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {data.byBookingType.length > 0 && (
            <Panel title={t("finance.byBookingType")} noPadding>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 text-start">
                        {t("common.type")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.count")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.revenue")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.totalCost")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.totalCommission")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.profit")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byBookingType.map((row) => (
                      <tr
                        key={row.type}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-2.5">
                          {t(`bookings.types.${row.type}`)}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums">
                          {row.count}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums">
                          {money(row.revenue)}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-gray-600">
                          {money(row.cost)}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-gray-600">
                          {money(row.commission)}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-2.5 text-end font-semibold tabular-nums",
                            row.profit < 0 ? "text-red-600" : "text-brand-green"
                          )}
                        >
                          {money(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {data.perVehicle.length > 0 && (
            <Panel
              title={t("finance.perVehicle")}
              description={t("finance.perVehicleHint")}
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 text-start">
                        {t("vehicles.vehicle")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.revenue")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.totalCost")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.expenses")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.netResult")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perVehicle.map((row) => (
                      <tr
                        key={row.vehicleId}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="flex items-center gap-2 px-5 py-2.5">
                          <Car className="h-3.5 w-3.5 text-gray-400" />
                          {row.label}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums">
                          {money(row.revenue)}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-gray-600">
                          {money(row.cost)}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-gray-600">
                          {money(row.expenses)}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-2.5 text-end font-semibold tabular-nums",
                            row.net < 0 ? "text-red-600" : "text-brand-green"
                          )}
                        >
                          {money(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.hotels.length > 0 && (
              <Panel title={t("finance.hotelCommissions")} noPadding>
                <ul className="divide-y divide-gray-50">
                  {data.hotels.map((row) => (
                    <li
                      key={row.hotelId}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{row.name}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-brand-green">
                        {money(row.commission)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {data.driverPayouts.length > 0 && (
              <Panel
                title={t("finance.driverPayouts")}
                description={t("finance.driverPayoutsHint")}
                noPadding
              >
                <ul className="divide-y divide-gray-50">
                  {data.driverPayouts.map((row) => (
                    <li key={row.driverId} className="px-5 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{row.name}</span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          {money(row.earned)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t("finance.paidOut", { amount: money(row.paid) })} ·{" "}
                        <span
                          className={
                            row.outstanding > 0 ? "text-amber-600" : undefined
                          }
                        >
                          {t("finance.stillOwed", {
                            amount: money(row.outstanding),
                          })}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {data.partnerCommissions.length > 0 && (
            <Panel title={t("finance.partnerCommissions")} noPadding>
              <ul className="divide-y divide-gray-50">
                {data.partnerCommissions.map((row) => (
                  <li
                    key={row.partnerId ?? row.name}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <Handshake className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{row.name}</span>
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold tabular-nums">
                        {money(row.amount)}
                      </span>
                      {row.unpaid > 0 && (
                        <span className="ms-2 text-xs text-amber-600">
                          {t("finance.unpaid", { amount: money(row.unpaid) })}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {data.byCurrency.length > 1 && (
            <Panel
              title={t("finance.byCurrency")}
              description={t("finance.byCurrencyHint")}
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 text-start">
                        {t("hotels.currency")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("finance.revenue")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.totalCost")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("bookings.profit")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byCurrency.map((row) => (
                      <tr
                        key={row.currency}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-2.5 font-semibold">
                          {row.currency}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums">
                          {formatNumber(row.revenue, locale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-gray-600">
                          {formatNumber(row.cost, locale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-2.5 text-end font-semibold tabular-nums">
                          {formatNumber(row.profit, locale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {currency !== "GEL" && (
            <p className="text-xs text-gray-500">
              {t("finance.rateNote", {
                currency,
                rate: formatNumber(data.displayRate, locale, {
                  maximumFractionDigits: 4,
                }),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
