"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Car, Pencil, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Link } from "@/src/i18n/routing";
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
  useDeleteVehicle,
  useVehicleBrands,
  useVehicles,
} from "@/src/hooks/admin/useVehicles";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { vehiclesApi } from "@/src/services/admin/vehicles.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatDate, fullName } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { adminPaths } from "@/src/utlis/admin/paths";
import {
  VEHICLE_OWNERSHIPS,
  VEHICLE_TYPES,
  type Vehicle,
} from "@/src/types/admin/drivers.types";
import VehicleFormDialog from "./VehicleFormDialog";

const FILTERS = [
  "search",
  "type",
  "ownership",
  "driverId",
  "hasDriver",
  "brand",
  "isActive",
  "createdById",
  "minYear",
  "maxYear",
  "minSeats",
  "maxSeats",
] as const;

export default function VehiclesListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({ filters: FILTERS, defaultSortBy: "createdAt" });
  const { data, isLoading, isError, refetch } = useVehicles(list.params);
  const deleteVehicle = useDeleteVehicle();
  const brands = useVehicleBrands();
  const drivers = useDriverOptions();
  const owners = useUsersLookup(true, canAll("DRIVERS", "view"));

  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  const fetchAll = useCallback(
    (limit: number) => vehiclesApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteVehicle.mutateAsync(toDelete.id);
      toast.success(t("vehicles.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<Vehicle>[] = [
    {
      key: "vehicle",
      header: t("vehicles.vehicle"),
      sortKey: "brand",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green print:hidden">
            <Car className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {row.brand} {row.model}
            </p>
            <p className="truncate text-xs text-gray-500">
              {t(`vehicles.${row.type}`)}
              {row.year ? ` · ${row.year}` : ""}
              {row.color ? ` · ${row.color}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "plateNumber",
      header: t("vehicles.plateNumber"),
      cell: (row) =>
        row.plateNumber ? (
          <span className="font-mono text-sm" dir="ltr">
            {row.plateNumber}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "seats",
      header: t("vehicles.seats"),
      sortKey: "seats",
      align: "end",
      cell: (row) => <span className="tabular-nums">{row.seats}</span>,
    },
    {
      key: "driver",
      header: t("vehicles.driver"),
      cell: (row) =>
        row.driver ? (
          <Link
            href={adminPaths.driver(row.driver.id)}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green hover:underline"
          >
            <User className="h-3.5 w-3.5" />
            {fullName(row.driver)}
          </Link>
        ) : (
          <span className="text-xs text-gray-400">
            {t("vehicles.unassigned")}
          </span>
        ),
    },
    {
      key: "ownership",
      header: t("vehicles.ownership"),
      hideOnMobile: true,
      cell: (row) => (
        <Badge tone={row.ownership === "COMPANY" ? "green" : "neutral"}>
          {t(`vehicles.ownerships.${row.ownership}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => (
        <Badge tone={row.isActive ? "green" : "neutral"}>
          {row.isActive ? t("users.active") : t("users.inactive")}
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
      key: "createdAt",
      header: t("common.date"),
      sortKey: "createdAt",
      hideOnMobile: true,
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
              onSelect: () => openEdit(row),
              hidden: !can("DRIVERS", "edit"),
            },
            {
              key: "driver",
              label: t("vehicles.openDriver"),
              icon: User,
              href: row.driverId ? adminPaths.driver(row.driverId) : undefined,
              hidden: !row.driverId,
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("DRIVERS", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.vehicles")}
        description={t("vehicles.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("DRIVERS", "create") && (
              <Button onClick={openCreate}>
                <Plus />
                {t("vehicles.new")}
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
            placeholder={t("vehicles.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("vehicles.type")}
          value={list.values.type}
          onChange={(v) => list.setFilter("type", v)}
          options={VEHICLE_TYPES.map((type) => ({
            value: type,
            label: t(`vehicles.${type}`),
          }))}
        />
        <SelectFilter
          label={t("vehicles.brand")}
          value={list.values.brand}
          onChange={(v) => list.setFilter("brand", v)}
          options={(brands.data ?? []).map((brand) => ({
            value: brand,
            label: brand,
          }))}
        />
        <SelectFilter
          label={t("vehicles.ownership")}
          value={list.values.ownership}
          onChange={(v) => list.setFilter("ownership", v)}
          options={VEHICLE_OWNERSHIPS.map((value) => ({
            value,
            label: t(`vehicles.ownerships.${value}`),
          }))}
        />
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
          label={t("vehicles.assignment")}
          value={list.values.hasDriver}
          onChange={(v) => list.setFilter("hasDriver", v)}
          options={[
            { value: "true", label: t("vehicles.assigned") },
            { value: "false", label: t("vehicles.unassigned") },
          ]}
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
          label={t("vehicles.year")}
          min={list.values.minYear}
          max={list.values.maxYear}
          onChange={(min, max) =>
            list.setFilters({ minYear: min, maxYear: max })
          }
        />
        <NumberRangeFilter
          label={t("vehicles.seats")}
          min={list.values.minSeats}
          max={list.values.maxSeats}
          onChange={(min, max) =>
            list.setFilters({ minSeats: min, maxSeats: max })
          }
        />
        {canAll("DRIVERS", "view") && (
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
        onRowClick={can("DRIVERS", "edit") ? openEdit : undefined}
        filtered={list.activeFilterCount > 0}
        rowClassName={(row) => (!row.isActive ? "opacity-60" : undefined)}
        emptyAction={
          can("DRIVERS", "create") && list.activeFilterCount === 0 ? (
            <Button onClick={openCreate}>
              <Plus />
              {t("vehicles.new")}
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

      <VehicleFormDialog
        open={formOpen}
        vehicle={editing}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("vehicles.deleteTitle")}
        description={t("vehicles.deleteText", {
          name: toDelete ? `${toDelete.brand} ${toDelete.model}` : "",
        })}
        loading={deleteVehicle.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
