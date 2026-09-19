"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import DataTable, { type DataColumn } from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import { useDeleteRole, useRolesList } from "@/src/hooks/admin/useAccess";
import { rolesApi } from "@/src/services/admin/access.service";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { Role } from "@/src/types/admin/access.types";

const FILTERS = ["search"] as const;

export default function RolesListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });
  const { data, isLoading, isError, refetch } = useRolesList(list.params);
  const deleteRole = useDeleteRole();
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const fetchAll = useCallback(
    (limit: number) => rolesApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteRole.mutateAsync(toDelete.id);
      toast.success(t("roles.deletedToast"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<Role>[] = [
    {
      key: "name",
      header: t("roles.name"),
      sortKey: "name",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{row.name}</p>
          {row.description && (
            <p className="line-clamp-2 text-xs text-gray-500">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "modules",
      header: t("roles.permissions"),
      cell: (row) => {
        const modules = row.permissions.filter((p) => p.canView);
        if (!modules.length)
          return <span className="text-xs text-gray-400">{t("roles.noPermissions")}</span>;
        return (
          <div className="flex max-w-xl flex-wrap gap-1">
            {modules.map((p) => (
              <Badge key={p.module} tone={p.scope === "ALL" ? "green" : "neutral"}>
                {t(`modules.${p.module}`)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "users",
      header: t("roles.users"),
      align: "center",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-gray-800">{row.userCount}</span>
      ),
    },
    {
      key: "updatedAt",
      header: t("roles.updated"),
      sortKey: "updatedAt",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">{formatDate(row.updatedAt, locale)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("list.actions")}</span>,
      mobileLabel: t("list.actions"),
      align: "end",
      hideOnPrint: true,
      cell: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("list.actions")}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={adminPaths.role(row.id)}>
                  <Pencil />
                  {t("common.edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setToDelete(row)}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("roles.title")}
        description={t("roles.subtitle")}
        printFilters={list.values.search ? `"${list.values.search}"` : undefined}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            <Button asChild>
              <Link href={adminPaths.roleNew}>
                <Plus />
                {t("roles.new")}
              </Link>
            </Button>
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
            placeholder={t("roles.searchPlaceholder")}
          />
        }
      />

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
        onRowClick={(row) => router.push(adminPaths.role(row.id))}
        filtered={list.activeFilterCount > 0}
        pagination={
          !printRows && (
            <Pagination meta={data?.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
          )
        }
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("roles.deleteTitle")}
        description={t("roles.deleteText", { count: toDelete?.userCount ?? 0 })}
        loading={deleteRole.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
