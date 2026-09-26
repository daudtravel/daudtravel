"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import { useAdminTours, useDeleteTour } from "@/src/hooks/admin/useAdminLists";
import { adminToursApi } from "@/src/services/admin/website.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import Thumb from "@/src/components/admin/common/Thumb";
import {
  pickLocalization,
  type AdminTourRow,
} from "@/src/types/admin/website.types";

const FILTERS = ["search", "type", "isPublic", "isDaily"] as const;

export default function ToursListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const { data, isLoading, isError, refetch } = useAdminTours(list.params);
  const deleteTour = useDeleteTour();
  const [toDelete, setToDelete] = useState<AdminTourRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) => adminToursApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const tourName = (row: AdminTourRow) =>
    pickLocalization(row.localizations, locale)?.name ?? "—";

  const price = (row: AdminTourRow) => {
    const value =
      row.groupPricing?.totalPrice ?? row.individualPricing?.seasonTotalPrice;
    return value !== undefined && value !== null
      ? formatMoney(value, "GEL", locale)
      : "—";
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTour.mutateAsync(toDelete.id);
      toast.success(t("tours.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const typeOptions = [
    { value: "GROUP", label: t("tours.group") },
    { value: "INDIVIDUAL", label: t("tours.individual") },
  ];
  const visibilityOptions = [
    { value: "true", label: t("website.published") },
    { value: "false", label: t("website.hidden") },
  ];
  const dailyOptions = [
    { value: "true", label: t("website.dailyOnly") },
    { value: "false", label: t("website.notDaily") },
  ];

  const printFilters = [
    list.values.search && `"${list.values.search}"`,
    list.values.type &&
      typeOptions.find((o) => o.value === list.values.type)?.label,
    list.values.isPublic &&
      visibilityOptions.find((o) => o.value === list.values.isPublic)?.label,
    list.values.isDaily &&
      dailyOptions.find((o) => o.value === list.values.isDaily)?.label,
  ]
    .filter(Boolean)
    .join(" · ");

  const columns: DataColumn<AdminTourRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Thumb
            src={row.mainImage}
            className="hidden h-10 w-14 sm:flex print:hidden"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {tourName(row)}
            </p>
            <p className="truncate text-xs text-gray-500">
              {pickLocalization(row.localizations, locale)?.startLocation}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: t("common.type"),
      cell: (row) => (
        <Badge tone={row.type === "GROUP" ? "blue" : "purple"}>
          {row.type === "GROUP" ? t("tours.group") : t("tours.individual")}
        </Badge>
      ),
    },
    {
      key: "duration",
      header: t("common.duration"),
      sortKey: "days",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">
          {t("common.days", { count: row.days })}
          {row.nights > 0 && ` / ${t("common.nights", { count: row.nights })}`}
        </span>
      ),
    },
    {
      key: "price",
      header: t("common.price"),
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {price(row)}
        </span>
      ),
    },
    {
      key: "visibility",
      header: t("website.visibility"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={row.isPublic ? "green" : "neutral"}>
            {row.isPublic ? <Eye /> : <EyeOff />}
            {row.isPublic ? t("website.published") : t("website.hidden")}
          </Badge>
          {row.isDaily && <Badge tone="yellow">{t("website.daily")}</Badge>}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("common.date"),
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
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              href: adminPaths.websiteTour(row.id),
              hidden: !can("WEBSITE", "edit"),
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("WEBSITE", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.websiteTours")}
        description={t("website.toursSubtitle")}
        printFilters={printFilters || undefined}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websiteTourNew}>
                  <Plus />
                  {t("tours.addTour")}
                </Link>
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
            placeholder={t("website.searchTours")}
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
          label={t("website.visibility")}
          value={list.values.isPublic}
          onChange={(v) => list.setFilter("isPublic", v)}
          options={visibilityOptions}
        />
        <SelectFilter
          label={t("website.daily")}
          value={list.values.isDaily}
          onChange={(v) => list.setFilter("isDaily", v)}
          options={dailyOptions}
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
        onRowClick={
          can("WEBSITE", "edit")
            ? (row) => router.push(adminPaths.websiteTour(row.id))
            : undefined
        }
        filtered={list.activeFilterCount > 0}
        emptyAction={
          can("WEBSITE", "create") && list.activeFilterCount === 0 ? (
            <Button asChild>
              <Link href={adminPaths.websiteTourNew}>
                <Plus />
                {t("tours.addTour")}
              </Link>
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
        title={t("tours.deleteTitle")}
        description={t("website.deleteText", {
          name: toDelete ? tourName(toDelete) : "",
        })}
        loading={deleteTour.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
