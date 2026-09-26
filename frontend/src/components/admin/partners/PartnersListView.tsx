"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
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
import { useDeletePartner, usePartners } from "@/src/hooks/admin/usePartners";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { partnersApi } from "@/src/services/admin/partners.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatDate, formatNumber, fullName } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  PARTNER_TYPES,
  type Partner,
} from "@/src/types/admin/partners.types";
import PartnerFormDialog from "./PartnerFormDialog";

const FILTERS = [
  "search",
  "type",
  "isActive",
  "createdById",
  "minRate",
  "maxRate",
] as const;

export default function PartnersListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });
  const { data, isLoading, isError, refetch } = usePartners(list.params);
  const deletePartner = useDeletePartner();
  const owners = useUsersLookup(true, canAll("PARTNERS", "view"));

  const [editing, setEditing] = useState<Partner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Partner | null>(null);

  const fetchAll = useCallback(
    (limit: number) => partnersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deletePartner.mutateAsync(toDelete.id);
      toast.success(t("partners.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<Partner>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortKey: "name",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{row.name}</p>
          <p className="truncate text-xs text-gray-500">
            {t(`partners.types.${row.type}`)}
          </p>
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
          {!row.phone && !row.email && (
            <span className="text-gray-300">—</span>
          )}
        </div>
      ),
    },
    {
      key: "commissionRate",
      header: t("partners.commissionRate"),
      sortKey: "commissionRate",
      align: "end",
      cell: (row) => (
        <span className="font-semibold tabular-nums">
          {formatNumber(row.commissionRate, locale, {
            maximumFractionDigits: 2,
          })}
          %
        </span>
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
              hidden: !can("PARTNERS", "edit"),
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("PARTNERS", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.partners")}
        description={t("partners.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("PARTNERS", "create") && (
              <Button onClick={openCreate}>
                <Plus />
                {t("partners.new")}
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
            placeholder={t("partners.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("common.type")}
          value={list.values.type}
          onChange={(v) => list.setFilter("type", v)}
          options={PARTNER_TYPES.map((type) => ({
            value: type,
            label: t(`partners.types.${type}`),
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
          label={t("partners.commissionRate")}
          min={list.values.minRate}
          max={list.values.maxRate}
          onChange={(min, max) =>
            list.setFilters({ minRate: min, maxRate: max })
          }
        />
        {canAll("PARTNERS", "view") && (
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
        onRowClick={can("PARTNERS", "edit") ? openEdit : undefined}
        filtered={list.activeFilterCount > 0}
        rowClassName={(row) => (!row.isActive ? "opacity-60" : undefined)}
        emptyAction={
          can("PARTNERS", "create") && list.activeFilterCount === 0 ? (
            <Button onClick={openCreate}>
              <Plus />
              {t("partners.new")}
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

      <PartnerFormDialog
        open={formOpen}
        partner={editing}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("partners.deleteTitle")}
        description={t("partners.deleteText", { name: toDelete?.name ?? "" })}
        loading={deletePartner.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
