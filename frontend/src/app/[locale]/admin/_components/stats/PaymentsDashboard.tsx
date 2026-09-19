"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "@/src/i18n/routing";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Wallet,
  CheckCircle,
  XCircle,
  Percent,
  AlertTriangle,
  RefreshCw,
  List,
} from "lucide-react";
import {
  usePaymentStats,
  PaymentType,
} from "@/src/hooks/payment-stats/usePaymentStats";

// Validated categorical palette (dataviz reference, light surface)
// Labels come from admin.paymentTypes.<type>
const TYPE_META: Record<PaymentType, { color: string }> = {
  tours: { color: "#2a78d6" },
  transfers: { color: "#1baf7a" },
  quick: { color: "#eda100" },
  insurance: { color: "#008300" },
};

const TYPE_ORDER: PaymentType[] = ["tours", "transfers", "quick", "insurance"];

// period is a preset key or a specific "YYYY-MM" month
type PeriodKey = "all" | "thisMonth" | "year" | "6m" | string;

const formatMoney = (value: number) =>
  `₾${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// returns [fromMonth, toMonth] inclusive; null bound = unbounded
const periodBounds = (period: PeriodKey): [string | null, string | null] => {
  const now = new Date();
  if (period === "all") return [null, null];
  if (period === "thisMonth") return [currentMonth(), currentMonth()];
  if (period === "year") return [`${now.getFullYear()}-01`, null];
  if (period === "6m") {
    const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return [
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      null,
    ];
  }
  // specific month "YYYY-MM"
  return [period, period];
};

const inPeriod = (month: string, [from, to]: [string | null, string | null]) =>
  (!from || month >= from) && (!to || month <= to);

export const PaymentsDashboard = () => {
  const router = useRouter();
  const t = useTranslations("admin");
  const locale = useLocale();
  const { data, isLoading, error, refetch, isRefetching } = usePaymentStats();

  const typeLabel = (type: PaymentType) => t(`paymentTypes.${type}`);

  const formatMonthShort = (month: string) => {
    const [year, m] = month.split("-");
    return `${t(`months.short.m${Number(m)}`)} ${year.slice(2)}`;
  };

  const formatMonthLong = (month: string) => {
    const [year, m] = month.split("-");
    return `${t(`months.long.m${Number(m)}`)} ${year}`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");

  const stats = data?.data;

  // months that actually have data, newest first — for the period dropdown
  const availableMonths = useMemo(() => {
    if (!stats) return [];
    const months = new Set(stats.grouped.map((row) => row.month));
    return Array.from(months).sort().reverse();
  }, [stats]);

  const bounds = useMemo(() => periodBounds(period), [period]);

  const filtered = useMemo(() => {
    if (!stats) return [];
    return stats.grouped.filter(
      (row) =>
        inPeriod(row.month, bounds) &&
        (typeFilter === "all" || row.type === typeFilter)
    );
  }, [stats, bounds, typeFilter]);

  const totals = useMemo(() => {
    const acc = {
      revenue: 0,
      paid: 0,
      failed: 0,
      pending: 0,
      refunded: 0,
    };
    filtered.forEach((row) => {
      if (row.status === "PAID") {
        acc.revenue += row.amount;
        acc.paid += row.count;
      } else if (row.status === "FAILED") acc.failed += row.count;
      else if (row.status === "PENDING") acc.pending += row.count;
      else if (row.status === "REFUNDED") acc.refunded += row.count;
    });
    const decided = acc.paid + acc.failed;
    return {
      ...acc,
      successRate: decided > 0 ? (acc.paid / decided) * 100 : null,
    };
  }, [filtered]);

  const visibleTypes = useMemo(
    () =>
      typeFilter === "all"
        ? TYPE_ORDER
        : TYPE_ORDER.filter((type) => type === typeFilter),
    [typeFilter]
  );

  const byType = useMemo(() => {
    return visibleTypes.map((type) => {
      const rows = filtered.filter((row) => row.type === type);
      const sum = (status: string, field: "count" | "amount") =>
        rows
          .filter((row) => row.status === status)
          .reduce((s, row) => s + row[field], 0);
      return {
        type,
        revenue: sum("PAID", "amount"),
        paid: sum("PAID", "count"),
        failed: sum("FAILED", "count"),
        pending: sum("PENDING", "count"),
        refunded: sum("REFUNDED", "count"),
      };
    });
  }, [filtered, visibleTypes]);

  const monthly = useMemo(() => {
    const paidRows = filtered.filter((row) => row.status === "PAID");
    if (paidRows.length === 0) return [];

    const months = paidRows.map((row) => row.month).sort();
    const first = months[0];
    const last = months[months.length - 1];

    // continuous month axis so gaps read as zero, not as missing
    const axis: string[] = [];
    const cursor = new Date(`${first}-01T00:00:00`);
    const end = new Date(`${last}-01T00:00:00`);
    while (cursor <= end) {
      axis.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return axis.map((month) => {
      const perType = {} as Record<PaymentType, number>;
      visibleTypes.forEach((type) => {
        perType[type] = paidRows
          .filter((row) => row.month === month && row.type === type)
          .reduce((s, row) => s + row.amount, 0);
      });
      const total = visibleTypes.reduce((s, type) => s + perType[type], 0);
      return { month, perType, total };
    });
  }, [filtered, visibleTypes]);

  const maxMonthTotal = useMemo(
    () => Math.max(1, ...monthly.map((m) => m.total)),
    [monthly]
  );

  // aggregate failure reasons over the active filters
  const failureReasons = useMemo(() => {
    if (!stats) return [];
    const map = new Map<string, { count: number; lastAt: string }>();
    stats.failureReasons
      .filter(
        (row) =>
          inPeriod(row.month, bounds) &&
          (typeFilter === "all" || row.type === typeFilter)
      )
      .forEach((row) => {
        const existing = map.get(row.reason);
        if (existing) {
          existing.count += row.count;
          if (row.lastAt > existing.lastAt) existing.lastAt = row.lastAt;
        } else {
          map.set(row.reason, { count: row.count, lastAt: row.lastAt });
        }
      });
    return Array.from(map, ([reason, v]) => ({ reason, ...v })).sort(
      (a, b) => b.count - a.count
    );
  }, [stats, bounds, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        {t("stats.loadFailed")}
      </div>
    );
  }

  const kpis = [
    {
      label: t("stats.revenue"),
      value: formatMoney(totals.revenue),
      icon: Wallet,
      iconClass: "text-brand-green bg-brand-green-50",
    },
    {
      label: t("stats.successfulPayments"),
      value: String(totals.paid),
      icon: CheckCircle,
      iconClass: "text-green-600 bg-green-50",
    },
    {
      label: t("stats.failedPayments"),
      value: String(totals.failed),
      icon: XCircle,
      iconClass: "text-red-600 bg-red-50",
    },
    {
      label: t("stats.successRate"),
      value:
        totals.successRate === null
          ? "—"
          : `${totals.successRate.toFixed(1)}%`,
      icon: Percent,
      iconClass: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("stats.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {period === "all"
              ? t("stats.allTime")
              : period === "thisMonth"
                ? formatMonthLong(currentMonth())
                : period === "year"
                  ? t("stats.thisYear")
                  : period === "6m"
                    ? t("stats.last6Months")
                    : formatMonthLong(period)}
            {typeFilter !== "all" && ` · ${typeLabel(typeFilter)}`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          title={t("common.refresh")}
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-brand-green transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        >
          <option value="all">{t("stats.allTime")}</option>
          <option value="thisMonth">{t("stats.thisMonth")}</option>
          <option value="year">{t("stats.thisYear")}</option>
          <option value="6m">{t("stats.last6Months")}</option>
          <option disabled>──────────</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthLong(month)}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap rounded-xl border border-gray-200 bg-white p-1 gap-0.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-brand-green text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t("common.all")}
          </button>
          {TYPE_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-brand-green text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: TYPE_META[type].color }}
              />
              {typeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${kpi.iconClass}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider truncate">
                  {kpi.label}
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {kpi.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 className="text-sm font-bold text-gray-900">
            {t("stats.revenueByMonth")}
          </h2>
          {visibleTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              {visibleTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: TYPE_META[type].color }}
                  />
                  {typeLabel(type)}
                </span>
              ))}
            </div>
          )}
        </div>

        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            {t("stats.noPaidOrders")}
          </p>
        ) : (
          <div className="overflow-x-auto pb-1">
            <div
              className="flex items-end gap-2"
              style={{ minWidth: `${monthly.length * 44}px`, height: "230px" }}
            >
              {monthly.map((m) => (
                <div
                  key={m.month}
                  className="group relative flex-1 flex flex-col justify-end h-full min-w-[36px] max-w-[120px]"
                >
                  {/* tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-bold mb-1">{formatMonthShort(m.month)}</p>
                    {visibleTypes
                      .filter((type) => m.perType[type] > 0)
                      .map((type) => (
                        <p key={type} className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-sm inline-block"
                            style={{ backgroundColor: TYPE_META[type].color }}
                          />
                          {typeLabel(type)}: {formatMoney(m.perType[type])}
                        </p>
                      ))}
                    <p className="border-t border-white/20 mt-1 pt-1 font-semibold">
                      {t("stats.total", { amount: formatMoney(m.total) })}
                    </p>
                  </div>

                  {/* stacked column: 2px gaps, rounded top on topmost segment */}
                  <div
                    className="flex flex-col-reverse w-full"
                    style={{ height: `${(m.total / maxMonthTotal) * 180}px` }}
                  >
                    {visibleTypes
                      .filter((type) => m.perType[type] > 0)
                      .map((type, idx, visible) => (
                        <div
                          key={type}
                          style={{
                            backgroundColor: TYPE_META[type].color,
                            flexGrow: m.perType[type],
                            flexBasis: 0,
                            marginTop: idx === visible.length - 1 ? 0 : "2px",
                            borderRadius:
                              idx === visible.length - 1
                                ? "4px 4px 0 0"
                                : undefined,
                          }}
                        />
                      ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5 whitespace-nowrap">
                    {formatMonthShort(m.month)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-type breakdown */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
          visibleTypes.length > 2 ? "xl:grid-cols-4" : ""
        }`}
      >
        {byType.map((row) => (
          <div
            key={row.type}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: TYPE_META[row.type].color }}
              />
              <h3 className="text-sm font-bold text-gray-900">
                {typeLabel(row.type)}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-3">
              {formatMoney(row.revenue)}
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                ✓ {t("stats.paidCount", { count: row.paid })}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                ✕ {t("stats.failedCount", { count: row.failed })}
              </span>
              {row.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                  {t("stats.pendingCount", { count: row.pending })}
                </span>
              )}
              {row.refunded > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {t("stats.refundedCount", { count: row.refunded })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Failure reasons (aggregated) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-gray-900">
              {t("stats.failureReasons")}
            </h2>
          </div>
          <button
            onClick={() => router.push(adminPaths.ordersStatuses)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-green hover:underline"
          >
            <List className="w-3.5 h-3.5" />
            {t("stats.allPaymentsList")}
          </button>
        </div>
        {failureReasons.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            {t("stats.noFailedPayments")}
          </p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {failureReasons.map((r) => (
              <div
                key={r.reason}
                className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">
                    {r.reason}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t("stats.lastAt", { date: formatDate(r.lastAt) })}
                  </p>
                </div>
                <span className="shrink-0 min-w-[28px] text-center px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsDashboard;
