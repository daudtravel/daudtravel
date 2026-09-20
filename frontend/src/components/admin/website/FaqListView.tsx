"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { useClientPage } from "@/src/components/admin/list/useClientPage";
import { useAdminFaqs, useDeleteFaq } from "@/src/hooks/admin/useAdminLists";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  pickLocalization,
  type AdminFaqRow,
} from "@/src/types/admin/website.types";

const FILTERS = ["search", "category"] as const;
const LOCALES = ["ka", "en", "ru", "ar", "tr"] as const;

export default function FaqListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({ filters: FILTERS });
  const { data, isLoading, isError, refetch } = useAdminFaqs();
  const deleteFaq = useDeleteFaq();
  const [toDelete, setToDelete] = useState<AdminFaqRow | null>(null);
  const [printAllRows, setPrintAllRows] = useState(false);

  const search = list.values.search.toLowerCase();
  const category = list.values.category;

  const filter = useCallback(
    (row: AdminFaqRow) => {
      if (category && (row.category ?? "") !== category) return false;
      if (!search) return true;
      return row.localizations.some(
        (loc) =>
          loc.question.toLowerCase().includes(search) ||
          loc.answer.toLowerCase().includes(search)
      );
    },
    [search, category]
  );

  const paged = useClientPage(data, {
    page: list.page,
    limit: list.limit,
    filter,
  });

  const categories = Array.from(
    new Set((data ?? []).map((row) => row.category).filter(Boolean))
  ) as string[];

  const question = (row: AdminFaqRow) =>
    pickLocalization(row.localizations, locale)?.question ?? "—";

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteFaq.mutateAsync(toDelete.id);
      toast.success(t("faq.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<AdminFaqRow>[] = [
    {
      key: "question",
      header: t("faq.question"),
      cell: (row) => {
        const loc = pickLocalization(row.localizations, locale);
        return (
          <div className="min-w-0 max-w-2xl">
            <p className="font-semibold text-gray-900">{question(row)}</p>
            <p className="line-clamp-2 text-xs text-gray-500">{loc?.answer}</p>
          </div>
        );
      },
    },
    {
      key: "category",
      header: t("common.category"),
      cell: (row) =>
        row.category ? (
          <Badge tone="neutral">{row.category}</Badge>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "languages",
      header: t("common.translations"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {LOCALES.map((code) => {
            const filled = row.localizations.some(
              (loc) => loc.locale === code && loc.question?.trim()
            );
            return (
              <span
                key={code}
                className={
                  filled
                    ? "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase text-brand-green bg-brand-green-50"
                    : "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase text-gray-300 bg-gray-50"
                }
              >
                {code}
              </span>
            );
          })}
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
              href: adminPaths.websiteFaq(row.id),
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
        title={t("nav.faqs")}
        description={t("website.faqsSubtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={async () => {
                setPrintAllRows(true);
                await new Promise((resolve) => setTimeout(resolve, 0));
                window.print();
                setPrintAllRows(false);
              }}
              allOnScreen={paged.meta.total <= paged.rows.length}
            />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websiteFaqNew}>
                  <Plus />
                  {t("faq.add")}
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
            placeholder={t("website.searchFaqs")}
          />
        }
      >
        <SelectFilter
          label={t("common.category")}
          value={list.values.category}
          onChange={(v) => list.setFilter("category", v)}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={printAllRows ? paged.all : paged.rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onRowClick={
          can("WEBSITE", "edit")
            ? (row) => router.push(adminPaths.websiteFaq(row.id))
            : undefined
        }
        filtered={list.activeFilterCount > 0}
        pagination={
          !printAllRows && (
            <Pagination
              meta={paged.meta}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
            />
          )
        }
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("faq.deleteTitle")}
        description={t("website.deleteText", {
          name: toDelete ? question(toDelete) : "",
        })}
        loading={deleteFaq.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
