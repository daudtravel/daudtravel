"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
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
  useAdminTransfers,
  useDeleteTransfer,
} from "@/src/hooks/admin/useAdminLists";
import { adminTransfersApi } from "@/src/services/admin/website.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  pickLocalization,
  type AdminTransferRow,
} from "@/src/types/admin/website.types";

const FILTERS = [
  "search",
  "vehicleType",
  "isPublic",
  "minPrice",
  "maxPrice",
] as const;

const VEHICLE_TYPES = ["SEDAN", "MINIVAN", "VITO", "SPRINTER", "BUS"] as const;

export default function TransfersListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
  });
  const { data, isLoading, isError, refetch } = useAdminTransfers(list.params);
  const deleteTransfer = useDeleteTransfer();
  const [toDelete, setToDelete] = useState<AdminTransferRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminTransfersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const route = (row: AdminTransferRow) => {
    const loc = pickLocalization(row.localizations, locale);
    return { from: loc?.startLocation ?? "—", to: loc?.endLocation ?? "—" };
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTransfer.mutateAsync(toDelete.id);
      toast.success(t("transfers.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const vehicleOptions = VEHICLE_TYPES.map((type) => ({
    value: type,
    label: t(`vehicles.${type}`),
  }));
  const visibilityOptions = [
    { value: "true", label: t("website.published") },
    { value: "false", label: t("website.hidden") },
  ];

  const columns: DataColumn<AdminTransferRow>[] = [
    {
      key: "route",
      header: t("transfers.route"),
      cell: (row) => {
        const { from, to } = route(row);
        return (
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="truncate">{from}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400 rtl:rotate-180" />
            <span className="truncate">{to}</span>
          </div>
        );
      },
    },
    {
      key: "vehicles",
      header: t("transfers.vehicleTypes"),
      cell: (row) =>
        row.vehicleTypes.length ? (
          <div className="flex flex-wrap gap-1">
            {row.vehicleTypes.map((vehicle) => (
              <Badge key={vehicle.id} tone="neutral">
                {t(`vehicles.${vehicle.type}`)} ·{" "}
                {formatMoney(vehicle.price, "GEL", locale)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">{t("website.noVehicles")}</span>
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
      key: "updatedAt",
      header: t("roles.updated"),
      sortKey: "updatedAt",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-gray-500">
          {formatDate(row.updatedAt, locale)}
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
              href: adminPaths.websiteTransfer(row.id),
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
        title={t("nav.websiteTransfers")}
        description={t("website.transfersSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websiteTransferNew}>
                  <Plus />
                  {t("transfers.newTransfer")}
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
            placeholder={t("website.searchTransfers")}
          />
        }
      >
        <SelectFilter
          label={t("website.vehicleType")}
          value={list.values.vehicleType}
          onChange={(v) => list.setFilter("vehicleType", v)}
          options={vehicleOptions}
        />
        <SelectFilter
          label={t("website.visibility")}
          value={list.values.isPublic}
          onChange={(v) => list.setFilter("isPublic", v)}
          options={visibilityOptions}
        />
        <NumberRangeFilter
          label={t("common.price")}
          min={list.values.minPrice}
          max={list.values.maxPrice}
          onChange={(min, max) => list.setFilters({ minPrice: min, maxPrice: max })}
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
            ? (row) => router.push(adminPaths.websiteTransfer(row.id))
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
        title={t("transfers.deleteTitle")}
        description={
          toDelete
            ? t("website.deleteText", {
                name: `${route(toDelete).from} → ${route(toDelete).to}`,
              })
            : ""
        }
        loading={deleteTransfer.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
