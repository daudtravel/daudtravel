"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Settings2, Trash2, Users } from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import PaymentStatusBadge, {
  usePaymentStatusOptions,
} from "@/src/components/admin/common/PaymentStatusBadge";
import FilterBar from "@/src/components/admin/list/FilterBar";
import SearchInput from "@/src/components/admin/list/SearchInput";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import DateRangeFilter from "@/src/components/admin/list/DateRangeFilter";
import DataTable, {
  type DataColumn,
} from "@/src/components/admin/list/DataTable";
import Pagination from "@/src/components/admin/list/Pagination";
import { useListQuery } from "@/src/components/admin/list/useListQuery";
import { usePrintAll } from "@/src/components/admin/list/usePrintAll";
import {
  useAdminInsuranceSubmissions,
  useDeleteInsuranceSubmission,
} from "@/src/hooks/admin/useAdminLists";
import { adminInsuranceApi } from "@/src/services/admin/orders.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { InsuranceSubmissionRow } from "@/src/types/admin/orders.types";

const FILTERS = ["search", "status", "dateFrom", "dateTo"] as const;

export default function InsuranceSubmissionsView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();
  const statusOptions = usePaymentStatusOptions();

  const list = useListQuery({ filters: FILTERS });
  const { data, isLoading, isError, refetch } = useAdminInsuranceSubmissions(
    list.params
  );
  const deleteSubmission = useDeleteInsuranceSubmission();
  const [toDelete, setToDelete] = useState<InsuranceSubmissionRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminInsuranceApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSubmission.mutateAsync(toDelete.id);
      toast.success(t("insurance.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<InsuranceSubmissionRow>[] = [
    {
      key: "submitter",
      header: t("insurance.submitter"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900" dir="ltr">
            {row.submitterEmail}
          </p>
          <p className="truncate text-xs text-gray-500">
            {row.people?.[0]?.fullName}
          </p>
        </div>
      ),
    },
    {
      key: "people",
      header: t("insurance.people"),
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-gray-800">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          {row.peopleCount}
        </span>
      ),
    },
    {
      key: "days",
      header: t("insurance.totalDays"),
      align: "center",
      cell: (row) => (
        <span className="tabular-nums text-gray-700">{row.totalDays}</span>
      ),
    },
    {
      key: "amount",
      header: t("common.amount"),
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.totalAmount, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: t("common.date"),
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
              key: "details",
              label: t("common.details"),
              icon: Eye,
              href: adminPaths.orderInsurance(row.id),
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("ONLINE_ORDERS", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.insuranceSubmissions")}
        description={t("orders.insuranceSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("WEBSITE", "edit") && (
              <Button variant="outline" asChild>
                <Link href={adminPaths.websiteInsuranceSettings}>
                  <Settings2 />
                  {t("nav.insuranceSettings")}
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
            placeholder={t("orders.searchInsurance")}
          />
        }
      >
        <SelectFilter
          label={t("common.status")}
          value={list.values.status}
          onChange={(v) => list.setFilter("status", v)}
          options={statusOptions}
          allLabel={t("common.allStatuses")}
        />
        <DateRangeFilter
          label={t("orders.orderDate")}
          from={list.values.dateFrom}
          to={list.values.dateTo}
          onChange={(from, to) => list.setFilters({ dateFrom: from, dateTo: to })}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? data?.data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
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
        title={t("insurance.deleteTitle")}
        description={t("common.confirmIrreversible")}
        loading={deleteSubmission.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
