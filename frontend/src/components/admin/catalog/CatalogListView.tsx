"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import Panel from "@/src/components/admin/common/Panel";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import NumberRangeFilter from "@/src/components/admin/list/NumberRangeFilter";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import {
  useCatalog,
  useCatalogFilterOptions,
  useDeleteCatalogItem,
} from "@/src/hooks/admin/useCatalog";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import {
  formatDateOnly,
  formatNumber,
  fullName,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import { VEHICLE_TYPES } from "@/src/types/admin/drivers.types";
import {
  CATALOG_CATEGORIES,
  CATALOG_SEASONS,
  CATALOG_UNITS,
  type CatalogItem,
} from "@/src/types/admin/catalog.types";
import CatalogFormDialog from "./CatalogFormDialog";
import { cn } from "@/src/utlis/cn";

const FILTERS = [
  "search",
  "category",
  "unit",
  "season",
  "vehicleType",
  "currency",
  "city",
  "isActive",
  "createdById",
  "minPrice",
  "maxPrice",
  "validOn",
  "displayCurrency",
] as const;

export default function CatalogListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultLimit: 50,
    defaultSortBy: "sortOrder",
    defaultSortOrder: "asc",
  });
  const { data, isLoading, isError, refetch } = useCatalog(list.params);
  const deleteItem = useDeleteCatalogItem();
  const filterOptions = useCatalogFilterOptions();
  const owners = useUsersLookup(true, canAll("CATALOG", "view"));

  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CatalogItem | null>(null);
  /** The client version leaves out what each line costs us. */
  const [printMode, setPrintMode] = useState<"internal" | "client">("internal");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    const done = () => {
      setPrinting(false);
      setPrintMode("internal");
    };
    window.addEventListener("afterprint", done, { once: true });
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const print = useCallback((mode: "internal" | "client") => {
    setPrintMode(mode);
    setPrinting(true);
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteItem.mutateAsync(toDelete.id);
      toast.success(t("catalog.deleted"));
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

  /** The price list reads best grouped by what kind of service it is. */
  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const row of data?.data ?? []) {
      const rows = map.get(row.category) ?? [];
      rows.push(row);
      map.set(row.category, rows);
    }
    return [...map.entries()];
  }, [data]);

  const costs = printMode === "client" ? "print:hidden" : undefined;

  return (
    <div>
      <PageHeader
        title={t("nav.catalog")}
        description={t("catalog.subtitle")}
        printTitle={t("catalog.printTitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => print("client")}>
              <FileText />
              {t("catalog.printClient")}
            </Button>
            <Button variant="outline" onClick={() => print("internal")}>
              <Printer />
              {t("catalog.printInternal")}
            </Button>
            {can("CATALOG", "create") && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus />
                {t("catalog.new")}
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
            placeholder={t("catalog.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("common.category")}
          value={list.values.category}
          onChange={(v) => list.setFilter("category", v)}
          options={CATALOG_CATEGORIES.map((category) => ({
            value: category,
            label: t(`catalog.categories.${category}`),
          }))}
        />
        <SelectFilter
          label={t("catalog.unit")}
          value={list.values.unit}
          onChange={(v) => list.setFilter("unit", v)}
          options={CATALOG_UNITS.map((unit) => ({
            value: unit,
            label: t(`catalog.units.${unit}`),
          }))}
        />
        <SelectFilter
          label={t("catalog.season")}
          value={list.values.season}
          onChange={(v) => list.setFilter("season", v)}
          options={CATALOG_SEASONS.map((season) => ({
            value: season,
            label: t(`catalog.seasons.${season}`),
          }))}
        />
        <SelectFilter
          label={t("vehicles.type")}
          value={list.values.vehicleType}
          onChange={(v) => list.setFilter("vehicleType", v)}
          options={VEHICLE_TYPES.map((type) => ({
            value: type,
            label: t(`vehicles.${type}`),
          }))}
        />
        <SelectFilter
          label={t("hotels.city")}
          value={list.values.city}
          onChange={(v) => list.setFilter("city", v)}
          options={(filterOptions.data?.cities ?? []).map((city) => ({
            value: city,
            label: city,
          }))}
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
        <SelectFilter
          label={t("common.status")}
          value={list.values.isActive}
          onChange={(v) => list.setFilter("isActive", v)}
          options={[
            { value: "true", label: t("users.active") },
            { value: "false", label: t("users.inactive") },
          ]}
        />
        <NumberRangeFilter
          label={t("catalog.price")}
          min={list.values.minPrice}
          max={list.values.maxPrice}
          onChange={(min, max) =>
            list.setFilters({ minPrice: min, maxPrice: max })
          }
        />
        <SelectFilter
          label={t("catalog.showIn")}
          value={list.values.displayCurrency}
          onChange={(v) => list.setFilter("displayCurrency", v)}
          allLabel={t("catalog.ownCurrency")}
          options={CURRENCIES.map((currency) => ({
            value: currency,
            label: currency,
          }))}
        />
        {canAll("CATALOG", "view") && (
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

      {isLoading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : isError ? (
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
      ) : groups.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <p className="text-sm text-gray-600">
              {list.activeFilterCount > 0
                ? t("list.noResults")
                : t("list.empty")}
            </p>
            {can("CATALOG", "create") && list.activeFilterCount === 0 && (
              <Button
                className="mt-3"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus />
                {t("catalog.new")}
              </Button>
            )}
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {groups.map(([category, rows]) => (
            <Panel
              key={category}
              title={t(`catalog.categories.${category}`)}
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 text-start">
                        {t("catalog.service")}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {t("catalog.unit")}
                      </th>
                      <th className="px-5 py-3 text-start">
                        {t("catalog.validity")}
                      </th>
                      <th className="px-5 py-3 text-end">
                        {t("catalog.price")}
                      </th>
                      <th className={cn("px-5 py-3 text-end", costs)}>
                        {t("catalog.cost")}
                      </th>
                      <th className={cn("px-5 py-3 text-end", costs)}>
                        {t("catalog.margin")}
                      </th>
                      <th className="w-12 px-2 py-3 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-gray-50 last:border-0",
                          !row.isActive && "opacity-60"
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {row.name}
                            </p>
                            {!row.isActive && (
                              <Badge tone="neutral">
                                {t("users.inactive")}
                              </Badge>
                            )}
                          </div>
                          {(row.description || row.city || row.vehicleType) && (
                            <p className="text-xs text-gray-500">
                              {[
                                row.city,
                                row.vehicleType
                                  ? t(`vehicles.${row.vehicleType}`)
                                  : null,
                                row.description,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {t(`catalog.units.${row.unit}`)}
                          {row.season !== "ALL_YEAR" && (
                            <span className="block">
                              {t(`catalog.seasons.${row.season}`)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {row.validFrom || row.validTo ? (
                            <>
                              {formatDateOnly(row.validFrom, locale)} —{" "}
                              {formatDateOnly(row.validTo, locale)}
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-end font-semibold tabular-nums">
                          {money(row.price, row.currency)}
                          {row.converted !== null &&
                            row.convertedCurrency !== row.currency && (
                              <span className="block text-xs font-normal text-gray-500">
                                ≈{" "}
                                {money(
                                  row.converted,
                                  row.convertedCurrency ?? ""
                                )}
                              </span>
                            )}
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-5 py-3 text-end tabular-nums text-gray-600",
                            costs
                          )}
                        >
                          {row.cost !== null ? (
                            money(row.cost, row.currency)
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-5 py-3 text-end font-semibold tabular-nums",
                            row.margin !== null && row.margin < 0
                              ? "text-red-600"
                              : "text-brand-green",
                            costs
                          )}
                        >
                          {row.margin !== null ? (
                            money(row.margin, row.currency)
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 print:hidden">
                          <RowActions
                            actions={[
                              {
                                key: "edit",
                                label: t("common.edit"),
                                icon: Pencil,
                                onSelect: () => {
                                  setEditing(row);
                                  setFormOpen(true);
                                },
                                hidden: !can("CATALOG", "edit"),
                              },
                              {
                                key: "delete",
                                label: t("common.delete"),
                                icon: Trash2,
                                danger: true,
                                separated: true,
                                onSelect: () => setToDelete(row),
                                hidden: !can("CATALOG", "delete"),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}

          <Pagination
            meta={data?.meta}
            onPageChange={list.setPage}
            onLimitChange={list.setLimit}
          />
        </div>
      )}

      <CatalogFormDialog
        open={formOpen}
        item={editing}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("catalog.deleteTitle")}
        description={t("catalog.deleteText", { name: toDelete?.name ?? "" })}
        loading={deleteItem.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
