"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DataTable, { type DataColumn } from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import {
  useDeleteUser,
  useRoleOptions,
  useUpdateUserFields,
  useUsersList,
} from "@/src/hooks/admin/useAccess";
import { usersApi } from "@/src/services/admin/access.service";
import { useAuth } from "@/src/auth/authProvider";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDateTime, fullName, initials } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { StaffUser } from "@/src/types/admin/access.types";
import SetPasswordDialog from "./SetPasswordDialog";

const FILTERS = ["search", "roleId", "isActive", "isAdmin"] as const;

export default function UsersListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { user: me } = useAuth();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const { data, isLoading, isError, isFetching, refetch } = useUsersList(
    list.params
  );
  const roleOptions = useRoleOptions();

  const updateUser = useUpdateUserFields();
  const deleteUser = useDeleteUser();
  const [toDelete, setToDelete] = useState<StaffUser | null>(null);
  const [passwordFor, setPasswordFor] = useState<StaffUser | null>(null);

  const fetchAll = useCallback(
    (limit: number) => usersApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const toggleActive = async (row: StaffUser) => {
    try {
      await updateUser.mutateAsync({
        id: row.id,
        payload: { isActive: !row.isActive },
      });
      toast.success(
        row.isActive ? t("users.deactivatedToast") : t("users.activatedToast")
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteUser.mutateAsync(toDelete.id);
      toast.success(t("users.deletedToast"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const statusOptions = [
    { value: "true", label: t("users.active") },
    { value: "false", label: t("users.inactive") },
  ];
  const typeOptions = [
    { value: "true", label: t("users.typeAdmin") },
    { value: "false", label: t("users.typeStaff") },
  ];
  const roles = (roleOptions.data ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const printFilters = [
    list.values.search && `"${list.values.search}"`,
    list.values.roleId &&
      `${t("users.roles")}: ${roles.find((r) => r.value === list.values.roleId)?.label ?? "—"}`,
    list.values.isActive &&
      `${t("users.status")}: ${statusOptions.find((o) => o.value === list.values.isActive)?.label}`,
    list.values.isAdmin &&
      `${t("users.filterType")}: ${typeOptions.find((o) => o.value === list.values.isAdmin)?.label}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const columns: DataColumn<StaffUser>[] = [
    {
      key: "name",
      header: t("users.name"),
      sortKey: "firstName",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green-50 text-xs font-bold text-brand-green print:hidden">
            {initials(row)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {fullName(row)}
              {row.id === me?.id && (
                <span className="ms-2 text-xs font-medium text-gray-400">
                  ({t("users.you")})
                </span>
              )}
            </p>
            <p className="truncate text-xs text-gray-500" dir="ltr">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "position",
      header: t("users.position"),
      cell: (row) => row.position || <span className="text-gray-300">—</span>,
    },
    {
      key: "phone",
      header: t("users.phone"),
      cell: (row) =>
        row.phone ? (
          <a href={`tel:${row.phone}`} className="hover:text-brand-green" dir="ltr">
            {row.phone}
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "roles",
      header: t("users.roles"),
      cell: (row) =>
        row.isAdmin ? (
          <Badge tone="dark">
            <ShieldCheck />
            {t("users.superAdmin")}
          </Badge>
        ) : row.roles.length ? (
          <div className="flex flex-wrap gap-1">
            {row.roles.map((role) => (
              <Badge key={role.id} tone="green">
                {role.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">{t("users.noRoles")}</span>
        ),
    },
    {
      key: "status",
      header: t("users.status"),
      cell: (row) => (
        <Badge tone={row.isActive ? "green" : "neutral"}>
          {row.isActive ? t("users.active") : t("users.inactive")}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: t("users.lastLogin"),
      sortKey: "lastLoginAt",
      cell: (row) =>
        row.lastLoginAt ? (
          <span className="whitespace-nowrap text-sm">
            {formatDateTime(row.lastLoginAt, locale)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">{t("users.never")}</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("list.actions")}</span>,
      mobileLabel: t("list.actions"),
      align: "end",
      hideOnPrint: true,
      cell: (row) => {
        const isSelf = row.id === me?.id;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("list.actions")}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href={adminPaths.user(row.id)}>
                    <Pencil />
                    {t("common.edit")}
                  </Link>
                </DropdownMenuItem>
                {!isSelf && (
                  <>
                    <DropdownMenuItem onSelect={() => setPasswordFor(row)}>
                      <KeyRound />
                      {t("users.resetPassword")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void toggleActive(row)}>
                      <Power />
                      {row.isActive ? t("users.deactivate") : t("users.activate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setToDelete(row)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <Trash2 />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("users.title")}
        description={t("users.subtitle")}
        printFilters={printFilters || undefined}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            <Button asChild>
              <Link href={adminPaths.userNew}>
                <Plus />
                {t("users.new")}
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
            placeholder={t("users.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("users.roles")}
          value={list.values.roleId}
          onChange={(v) => list.setFilter("roleId", v)}
          options={roles}
        />
        <SelectFilter
          label={t("users.status")}
          value={list.values.isActive}
          onChange={(v) => list.setFilter("isActive", v)}
          options={statusOptions}
        />
        <SelectFilter
          label={t("users.filterType")}
          value={list.values.isAdmin}
          onChange={(v) => list.setFilter("isAdmin", v)}
          options={typeOptions}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? data?.data}
        rowKey={(row) => row.id}
        isLoading={isLoading || (isFetching && !data)}
        isError={isError}
        onRetry={() => void refetch()}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={(field) => list.toggleSort(field)}
        onRowClick={(row) => router.push(adminPaths.user(row.id))}
        filtered={list.activeFilterCount > 0}
        emptyAction={
          list.activeFilterCount === 0 ? (
            <Button asChild>
              <Link href={adminPaths.userNew}>
                <Plus />
                {t("users.new")}
              </Link>
            </Button>
          ) : undefined
        }
        rowClassName={(row) => (!row.isActive ? "opacity-60" : undefined)}
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
        title={t("users.deleteTitle")}
        description={t("users.deleteText", { name: fullName(toDelete) })}
        loading={deleteUser.isPending}
        onConfirm={() => void confirmDelete()}
      />

      <SetPasswordDialog
        user={passwordFor}
        onOpenChange={(open) => !open && setPasswordFor(null)}
      />
    </div>
  );
}
