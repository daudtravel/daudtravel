"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeftRight, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import PrintButton from "@/src/components/admin/common/PrintButton";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DateRangeFilter from "@/src/components/admin/list/DateRangeFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import {
  useLatestRates,
  useRateHistory,
  useRefreshRates,
} from "@/src/hooks/admin/useCurrency";
import { currencyApi } from "@/src/services/admin/currency.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatDate, formatDateTime, formatNumber } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  BASE_CURRENCY,
  CURRENCIES,
  convertWithRates,
  type CurrencyCode,
  type LatestRate,
  type RateRow,
  type RateSource,
} from "@/src/types/admin/currency.types";
import SetRateDialog from "./SetRateDialog";

const FILTERS = ["currency", "source", "dateFrom", "dateTo"] as const;

const SOURCE_TONE: Record<RateSource, "green" | "blue" | "yellow"> = {
  NBG: "green",
  EXCHANGERATE_API: "blue",
  MANUAL: "yellow",
};

export default function CurrencyView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const latest = useLatestRates();
  const refresh = useRefreshRates();
  const [editing, setEditing] = useState<LatestRate | null>(null);

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "date",
    defaultSortOrder: "desc",
    defaultLimit: 20,
  });
  const history = useRateHistory(list.params);
  const fetchAll = useCallback(
    (limit: number) => currencyApi.history({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const rateMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of latest.data ?? []) map[row.currency] = row.rate;
    return map;
  }, [latest.data]);

  // Converter
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>(BASE_CURRENCY);
  const converted = convertWithRates(Number(amount.replace(",", ".")), from, to, rateMap);

  const onRefresh = async () => {
    try {
      const result = await refresh.mutateAsync();
      toast.success(t("currency.refreshed", { count: result.saved }));
      if (result.missing?.length) {
        toast.warning(
          t("currency.someMissing", { list: result.missing.join(", ") })
        );
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const sourceLabel = (source: RateSource | null) =>
    source ? t(`currency.sources.${source}`) : t("currency.baseCurrency");

  const columns: DataColumn<RateRow>[] = [
    {
      key: "date",
      header: t("common.date"),
      sortKey: "date",
      cell: (row) => (
        <span className="whitespace-nowrap font-medium">
          {formatDate(row.date, locale)}
        </span>
      ),
    },
    {
      key: "currency",
      header: t("currency.currency"),
      sortKey: "currency",
      cell: (row) => <span className="font-semibold">{row.currency}</span>,
    },
    {
      key: "rate",
      header: t("currency.rateColumn"),
      sortKey: "rate",
      align: "end",
      cell: (row) => (
        <span className="tabular-nums">
          {formatNumber(row.rate, locale, { maximumFractionDigits: 6 })}
        </span>
      ),
    },
    {
      key: "source",
      header: t("currency.source"),
      cell: (row) => (
        <Badge tone={SOURCE_TONE[row.source]}>{sourceLabel(row.source)}</Badge>
      ),
    },
    {
      key: "fetchedAt",
      header: t("currency.fetchedAt"),
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-500">
          {formatDateTime(row.fetchedAt, locale)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.currency")}
        description={t("currency.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={
                (history.data?.meta.total ?? 0) <=
                (history.data?.data.length ?? 0)
              }
            />
            {can("CURRENCY", "edit") && (
              <Button onClick={() => void onRefresh()} disabled={refresh.isPending}>
                <RefreshCw className={refresh.isPending ? "animate-spin" : undefined} />
                {t("currency.refreshNow")}
              </Button>
            )}
          </>
        }
      />

      {/* Rate cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {latest.isLoading
          ? [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : (latest.data ?? [])
              .filter((row) => row.currency !== BASE_CURRENCY)
              .map((row) => (
                <div
                  key={row.currency}
                  data-print-card
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        1 {row.currency}
                      </p>
                      <p className="mt-0.5 text-xl font-bold tabular-nums text-brand-green">
                        {row.rate
                          ? formatNumber(row.rate, locale, {
                              maximumFractionDigits: 4,
                            })
                          : "—"}{" "}
                        <span className="text-sm font-semibold text-gray-500">
                          {BASE_CURRENCY}
                        </span>
                      </p>
                      {!!row.rate && (
                        <p className="mt-1 text-xs text-gray-500 tabular-nums">
                          1 {BASE_CURRENCY} ={" "}
                          {formatNumber(1 / row.rate, locale, {
                            maximumFractionDigits: 4,
                          })}{" "}
                          {row.currency}
                        </p>
                      )}
                    </div>
                    {can("CURRENCY", "edit") && (
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-green-50 hover:text-brand-green print:hidden"
                        aria-label={t("currency.setManual")}
                        title={t("currency.setManual")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={row.source ? SOURCE_TONE[row.source] : "neutral"}>
                      {sourceLabel(row.source)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {row.date ? formatDate(row.date, locale) : t("currency.noRate")}
                    </span>
                    {row.stale && row.rate > 0 && (
                      <span
                        className="flex items-center gap-1 text-xs font-medium text-amber-600"
                        title={t("currency.staleHint")}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {t("currency.stale")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
      </div>

      {/* Converter */}
      <Panel
        title={t("currency.converter")}
        description={t("currency.converterHint")}
        className="mb-6 print:hidden"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[8rem] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              {t("common.amount")}
            </label>
            <Input
              value={amount}
              inputMode="decimal"
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 rounded-xl tabular-nums"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              {t("currency.from")}
            </label>
            <Select value={from} onValueChange={(v) => setFrom(v as CurrencyCode)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-brand-green-50 hover:text-brand-green"
            aria-label={t("currency.swap")}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <div className="w-32">
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              {t("currency.to")}
            </label>
            <Select value={to} onValueChange={(v) => setTo(v as CurrencyCode)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[10rem] flex-1 rounded-xl bg-brand-green-50 px-4 py-2.5">
            <p className="text-xs font-semibold text-brand-green/70">
              {t("currency.result")}
            </p>
            <p className="text-lg font-bold tabular-nums text-brand-green">
              {converted === null
                ? "—"
                : `${formatNumber(converted, locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${to}`}
            </p>
          </div>
        </div>
      </Panel>

      {/* History */}
      <FilterBar
        activeCount={list.activeFilterCount}
        onReset={list.resetFilters}
        aside={
          <p className="text-sm font-semibold text-gray-700">
            {t("currency.history")}
          </p>
        }
      >
        <SelectFilter
          label={t("currency.currency")}
          value={list.values.currency}
          onChange={(v) => list.setFilter("currency", v)}
          options={CURRENCIES.filter((c) => c !== BASE_CURRENCY).map((code) => ({
            value: code,
            label: code,
          }))}
        />
        <SelectFilter
          label={t("currency.source")}
          value={list.values.source}
          onChange={(v) => list.setFilter("source", v)}
          options={(["NBG", "EXCHANGERATE_API", "MANUAL"] as RateSource[]).map(
            (source) => ({ value: source, label: t(`currency.sources.${source}`) })
          )}
        />
        <DateRangeFilter
          label={t("common.date")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(f, tt) => list.setFilters({ dateFrom: f, dateTo: tt })}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? history.data?.data}
        rowKey={(row) => row.id}
        isLoading={history.isLoading}
        isError={history.isError}
        onRetry={() => void history.refetch()}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={(field) => list.toggleSort(field)}
        filtered={list.activeFilterCount > 0}
        pagination={
          !printRows && (
            <Pagination
              meta={history.data?.meta}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
            />
          )
        }
      />

      <p className="mt-4 text-xs text-gray-400 print:hidden">
        {t("currency.attribution")}
      </p>

      <SetRateDialog
        rate={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
