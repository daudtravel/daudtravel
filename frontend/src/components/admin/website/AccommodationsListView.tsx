"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { BedDouble, Eye, EyeOff, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import NumberRangeFilter from "@/src/components/admin/list/NumberRangeFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import {
  useAccommodationFilterOptions,
  useAdminAccommodations,
  useDeleteAccommodationRow,
} from "@/src/hooks/admin/useAdminLists";
import { adminAccommodationsApi } from "@/src/services/admin/website.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import Thumb from "@/src/components/admin/common/Thumb";
import {
  pickLocalization,
  type AdminAccommodationRow,
} from "@/src/types/admin/website.types";

const FILTERS = [
  "search",
  "type",
  "city",
  "isPublic",
  "minPrice",
  "maxPrice",
] as const;

export default function AccommodationsListView() {
  const t = useTranslations("admin");
  const tAcc = useTranslations("accommodations");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const { data, isLoading, isError, refetch } = useAdminAccommodations(
    list.params
  );
  const options = useAccommodationFilterOptions();
  const deleteItem = useDeleteAccommodationRow();
  const [toDelete, setToDelete] = useState<AdminAccommodationRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminAccommodationsApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const name = (row: AdminAccommodationRow) =>
    pickLocalization(row.localizations, locale)?.name ?? "—";

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteItem.mutateAsync(toDelete.id);
      toast.success(t("accommodations.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const typeOptions = [
    { value: "HOTEL", label: tAcc("hotel") },
    { value: "APARTMENT", label: tAcc("apartment") },
  ];
  const visibilityOptions = [
    { value: "true", label: t("website.published") },
    { value: "false", label: t("website.hidden") },
  ];
  const cityOptions = (options.data?.cities ?? []).map((city) => ({
    value: city,
    label: city,
  }));

  const columns: DataColumn<AdminAccommodationRow>[] = [
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
            <p className="truncate font-semibold text-gray-900">{name(row)}</p>
            <p className="truncate text-xs text-gray-500">
              {pickLocalization(row.localizations, locale)?.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: t("common.type"),
      cell: (row) => (
        <Badge tone={row.type === "HOTEL" ? "blue" : "purple"}>
          {row.type === "HOTEL"
            ? tAcc("hotel")
            : tAcc("apartment")}
        </Badge>
      ),
    },
    {
      key: "city",
      header: t("accommodations.city"),
      sortKey: "city",
      cell: (row) => row.city || <span className="text-gray-300">—</span>,
    },
    {
      key: "capacity",
      header: t("website.capacity"),
      cell: (row) => (
        <span className="flex items-center gap-3 whitespace-nowrap text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {row.maxGuests}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {row.bedrooms}
          </span>
        </span>
      ),
    },
    {
      key: "price",
      header: t("accommodations.pricePerNight"),
      sortKey: "price",
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.price, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "visibility",
      header: t("website.visibility"),
      cell: (row) => (
        <Badge tone={row.isPublic ? "green" : "neutral"}>
          {row.isPublic ? <Eye /> : <EyeOff />}
          {row.isPublic ? t("website.published") : t("website.hidden")}
        </Badge>
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
              href: adminPaths.websiteAccommodation(row.id),
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
        title={t("nav.websiteAccommodations")}
        description={t("website.accommodationsSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websiteAccommodationNew}>
                  <Plus />
                  {t("website.addAccommodation")}
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
            placeholder={t("website.searchAccommodations")}
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
          label={t("accommodations.city")}
          value={list.values.city}
          onChange={(v) => list.setFilter("city", v)}
          options={cityOptions}
        />
        <SelectFilter
          label={t("website.visibility")}
          value={list.values.isPublic}
          onChange={(v) => list.setFilter("isPublic", v)}
          options={visibilityOptions}
        />
        <NumberRangeFilter
          label={t("accommodations.pricePerNight")}
          min={list.values.minPrice}
          max={list.values.maxPrice}
          onChange={(min, max) =>
            list.setFilters({ minPrice: min, maxPrice: max })
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
        onRowClick={
          can("WEBSITE", "edit")
            ? (row) => router.push(adminPaths.websiteAccommodation(row.id))
            : undefined
        }
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("accommodations.deleteTitle")}
        description={t("website.deleteText", {
          name: toDelete ? name(toDelete) : "",
        })}
        loading={deleteItem.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
