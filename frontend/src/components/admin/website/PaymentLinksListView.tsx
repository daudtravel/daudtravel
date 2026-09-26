"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Globe,
  Pencil,
  Plus,
  Power,
  ShoppingBag,
  Trash2,
} from "lucide-react";
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
import {
  useAdminPaymentLinks,
  useDeletePaymentLink,
  useTogglePaymentLink,
} from "@/src/hooks/admin/useAdminLists";
import { adminPaymentLinksApi } from "@/src/services/admin/website.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate, formatMoney } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import Thumb from "@/src/components/admin/common/Thumb";
import type { AdminPaymentLinkRow } from "@/src/types/admin/website.types";

const FILTERS = ["search", "isActive", "showOnWebsite"] as const;

export default function PaymentLinksListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({ filters: FILTERS, defaultLimit: 10 });
  const { data, isLoading, isError, refetch } = useAdminPaymentLinks({
    ...list.params,
    locale,
  });
  const toggleLink = useTogglePaymentLink();
  const deleteLink = useDeletePaymentLink();
  const [toDelete, setToDelete] = useState<AdminPaymentLinkRow | null>(null);

  const fetchAll = useCallback(
    (limit: number) =>
      adminPaymentLinksApi.list({ ...list.params, locale, page: 1, limit }),
    [list.params, locale]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const copyLink = async (row: AdminPaymentLinkRow) => {
    try {
      await navigator.clipboard.writeText(row.paymentLink);
      toast.success(t("quickLinks.linkCopied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const onToggle = async (row: AdminPaymentLinkRow) => {
    try {
      await toggleLink.mutateAsync(row.slug);
      toast.success(
        row.isActive ? t("quickLinks.deactivated") : t("quickLinks.activated")
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteLink.mutateAsync(toDelete.slug);
      toast.success(t("quickLinks.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const activeOptions = [
    { value: "true", label: t("quickLinks.active") },
    { value: "false", label: t("quickLinks.inactive") },
  ];
  const websiteOptions = [
    { value: "true", label: t("website.onWebsite") },
    { value: "false", label: t("website.notOnWebsite") },
  ];

  const columns: DataColumn<AdminPaymentLinkRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Thumb
            src={row.image}
            sizes="40px"
            className="hidden h-10 w-10 sm:flex print:hidden"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {row.name || "—"}
            </p>
            <p className="truncate text-xs text-gray-500" dir="ltr">
              /{row.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: t("common.price"),
      align: "end",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(row.price, "GEL", locale)}
        </span>
      ),
    },
    {
      key: "orders",
      header: t("quickLinks.paidOrders"),
      align: "center",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-gray-800">
          {row.paidOrdersCount}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={row.isActive ? "green" : "neutral"}>
            {row.isActive ? t("quickLinks.active") : t("quickLinks.inactive")}
          </Badge>
          {row.showOnWebsite && (
            <Badge tone="blue">
              <Globe />
              {t("website.onWebsite")}
            </Badge>
          )}
        </div>
      ),
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
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              href: adminPaths.websitePaymentLink(row.slug),
              hidden: !can("WEBSITE", "edit"),
            },
            {
              key: "copy",
              label: t("quickLinks.copyLink"),
              icon: Copy,
              onSelect: () => void copyLink(row),
            },
            {
              key: "open",
              label: t("quickLinks.openLink"),
              icon: ExternalLink,
              externalHref: row.paymentLink,
            },
            {
              key: "orders",
              label: t("nav.paymentLinkOrders"),
              icon: ShoppingBag,
              href: `${adminPaths.ordersPaymentLinks}?linkId=${row.id}`,
              hidden: !can("ONLINE_ORDERS", "view"),
            },
            {
              key: "toggle",
              label: row.isActive
                ? t("quickLinks.deactivate")
                : t("quickLinks.activate"),
              icon: Power,
              onSelect: () => void onToggle(row),
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
        title={t("nav.paymentLinks")}
        description={t("website.paymentLinksSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websitePaymentLinkNew}>
                  <Plus />
                  {t("quickLinks.create")}
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
            placeholder={t("website.searchPaymentLinks")}
          />
        }
      >
        <SelectFilter
          label={t("common.status")}
          value={list.values.isActive}
          onChange={(v) => list.setFilter("isActive", v)}
          options={activeOptions}
        />
        <SelectFilter
          label={t("website.onWebsite")}
          value={list.values.showOnWebsite}
          onChange={(v) => list.setFilter("showOnWebsite", v)}
          options={websiteOptions}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printRows ?? data?.data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onRowClick={
          can("WEBSITE", "edit")
            ? (row) => router.push(adminPaths.websitePaymentLink(row.slug))
            : undefined
        }
        filtered={list.activeFilterCount > 0}
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
        title={t("quickLinks.deleteTitle")}
        description={t("website.deleteText", { name: toDelete?.name ?? "" })}
        loading={deleteLink.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
