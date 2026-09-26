"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Car,
  Eye,
  EyeOff,
  Mail,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import Thumb from "@/src/components/admin/common/Thumb";
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
  useDeleteDriver,
  useDriverLanguages,
  useDrivers,
} from "@/src/hooks/admin/useDrivers";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { adminDriversApi } from "@/src/services/admin/drivers.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatNumber, fullName } from "@/src/utlis/admin/format";
import { getApiErrorCode, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useRouter } from "@/src/i18n/routing";
import {
  VEHICLE_TYPES,
  type AdminDriver,
} from "@/src/types/admin/drivers.types";
import DriverFormDialog from "./DriverFormDialog";

const FILTERS = [
  "search",
  "language",
  "vehicleType",
  "hasVehicle",
  "isActive",
  "showOnWebsite",
  "referrerId",
  "createdById",
  "minRent",
  "maxRent",
] as const;

export default function DriversListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({ filters: FILTERS, defaultSortBy: "createdAt" });
  const { data, isLoading, isError, refetch } = useDrivers(list.params);
  const deleteDriver = useDeleteDriver();
  const languages = useDriverLanguages();
  const partners = usePartnerOptions();
  const owners = useUsersLookup(true, canAll("DRIVERS", "view"));

  const [editing, setEditing] = useState<AdminDriver | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminDriver | null>(null);

  const fetchAll = useCallback(
    (limit: number) => adminDriversApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (driver: AdminDriver) => {
    setEditing(driver);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDriver.mutateAsync(toDelete.id);
      toast.success(t("drivers.deleted"));
      setToDelete(null);
    } catch (error) {
      // A driver with vehicles or website orders may only be deactivated
      if (getApiErrorCode(error) === "IN_USE") {
        toast.error(t("drivers.inUse"));
      } else {
        toast.error(errorMessage(error));
      }
      setToDelete(null);
    }
  };

  const columns: DataColumn<AdminDriver>[] = [
    {
      key: "driver",
      header: t("drivers.driver"),
      sortKey: "firstName",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Thumb
            src={row.photo}
            alt={fullName(row)}
            className="h-10 w-10 rounded-full"
            sizes="40px"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {fullName(row)}
            </p>
            <p className="truncate text-xs text-gray-500">
              {row.languages.length
                ? row.languages.join(", ")
                : t("drivers.noLanguages")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: t("partners.contact"),
      cell: (row) => (
        <div className="space-y-0.5 text-sm">
          {row.phone && (
            <a
              href={`tel:${row.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
              dir="ltr"
            >
              <Phone className="h-3 w-3 shrink-0 text-gray-400" />
              {row.phone}
            </a>
          )}
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
              dir="ltr"
            >
              <Mail className="h-3 w-3 shrink-0 text-gray-400" />
              {row.email}
            </a>
          )}
          {!row.phone && !row.email && <span className="text-gray-300">—</span>}
        </div>
      ),
    },
    {
      key: "vehicles",
      header: t("nav.vehicles"),
      cell: (row) =>
        row.vehicles.length ? (
          <div className="space-y-0.5">
            {row.vehicles.slice(0, 2).map((vehicle) => (
              <p
                key={vehicle.id}
                className="flex items-center gap-1.5 text-sm text-gray-700"
              >
                <Car className="h-3 w-3 shrink-0 text-gray-400" />
                <span className="truncate">
                  {vehicle.brand} {vehicle.model}
                  {vehicle.year ? ` · ${vehicle.year}` : ""}
                </span>
              </p>
            ))}
            {row.vehicles.length > 2 && (
              <p className="text-xs text-gray-400">
                {t("list.more", { count: row.vehicles.length - 2 })}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">
            {t("drivers.noVehicle")}
          </span>
        ),
    },
    {
      key: "dailyRentPrice",
      header: t("drivers.dailyRentPrice"),
      sortKey: "dailyRentPrice",
      align: "end",
      hideOnMobile: true,
      cell: (row) =>
        row.dailyRentPrice !== null ? (
          <span className="font-semibold tabular-nums">
            {formatNumber(row.dailyRentPrice, locale)} ₾
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "rating",
      header: t("drivers.rating"),
      align: "end",
      hideOnMobile: true,
      cell: (row) =>
        row.averageRating !== null ? (
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
            <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
            {formatNumber(row.averageRating, locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            <span className="text-xs font-normal text-gray-400">
              ({row.totalReviews})
            </span>
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={row.isActive ? "green" : "neutral"}>
            {row.isActive ? t("users.active") : t("users.inactive")}
          </Badge>
          <Badge tone={row.showOnWebsite ? "yellow" : "neutral"}>
            {row.showOnWebsite ? t("drivers.onWebsite") : t("drivers.internal")}
          </Badge>
        </div>
      ),
    },
    {
      key: "referrer",
      header: t("drivers.referrer"),
      hideOnMobile: true,
      cell: (row) =>
        row.referrer ? (
          <div className="min-w-0">
            <p className="truncate text-sm text-gray-700">
              {row.referrer.name}
            </p>
            {row.referrerCommissionRate !== null && (
              <p className="text-xs text-gray-500 tabular-nums">
                {formatNumber(row.referrerCommissionRate, locale)}%
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
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
              href: adminPaths.driver(row.id),
            },
            {
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              onSelect: () => openEdit(row),
              hidden: !can("DRIVERS", "edit"),
            },
            {
              key: "website",
              label: t("drivers.viewOnWebsite"),
              icon: row.showOnWebsite ? Eye : EyeOff,
              externalHref: `/${locale}/drivers/${row.id}`,
              hidden: !row.showOnWebsite || !row.isActive,
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
        title={t("nav.drivers")}
        description={t("drivers.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("DRIVERS", "create") && (
              <Button onClick={openCreate}>
                <Plus />
                {t("drivers.new")}
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
            placeholder={t("drivers.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("drivers.language")}
          value={list.values.language}
          onChange={(v) => list.setFilter("language", v)}
          options={(languages.data ?? []).map((language) => ({
            value: language,
            label: language,
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
          label={t("nav.vehicles")}
          value={list.values.hasVehicle}
          onChange={(v) => list.setFilter("hasVehicle", v)}
          options={[
            { value: "true", label: t("drivers.withVehicle") },
            { value: "false", label: t("drivers.withoutVehicle") },
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
        <SelectFilter
          label={t("drivers.visibility")}
          value={list.values.showOnWebsite}
          onChange={(v) => list.setFilter("showOnWebsite", v)}
          options={[
            { value: "true", label: t("drivers.onWebsite") },
            { value: "false", label: t("drivers.internal") },
          ]}
        />
        <SelectFilter
          label={t("drivers.referrer")}
          value={list.values.referrerId}
          onChange={(v) => list.setFilter("referrerId", v)}
          options={(partners.data ?? []).map((partner) => ({
            value: partner.id,
            label: partner.name,
          }))}
        />
        <NumberRangeFilter
          label={t("drivers.dailyRentPrice")}
          min={list.values.minRent}
          max={list.values.maxRent}
          onChange={(min, max) =>
            list.setFilters({ minRent: min, maxRent: max })
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
        onRowClick={(row) => router.push(adminPaths.driver(row.id))}
        filtered={list.activeFilterCount > 0}
        rowClassName={(row) => (!row.isActive ? "opacity-60" : undefined)}
        emptyAction={
          can("DRIVERS", "create") && list.activeFilterCount === 0 ? (
            <Button onClick={openCreate}>
              <Plus />
              {t("drivers.new")}
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

      <DriverFormDialog
        open={formOpen}
        driver={editing}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("drivers.deleteTitle")}
        description={t("drivers.deleteConfirm", {
          name: toDelete ? fullName(toDelete) : "",
        })}
        loading={deleteDriver.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
