"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useAdminVideos, useDeleteVideo } from "@/src/hooks/admin/useAdminLists";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDate } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  pickLocalization,
  type AdminVideoRow,
} from "@/src/types/admin/website.types";

const FILTERS = ["search", "category"] as const;

export default function VideosListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const list = useListQuery({ filters: FILTERS });
  const { data, isLoading, isError, refetch } = useAdminVideos();
  const deleteVideo = useDeleteVideo();
  const [toDelete, setToDelete] = useState<AdminVideoRow | null>(null);

  const search = list.values.search.toLowerCase();
  const category = list.values.category;

  const title = useCallback(
    (row: AdminVideoRow) =>
      pickLocalization(row.localizations, locale)?.title ?? row.title ?? "—",
    [locale]
  );

  const filter = useCallback(
    (row: AdminVideoRow) => {
      if (category && (row.category ?? "") !== category) return false;
      if (!search) return true;
      return (
        title(row).toLowerCase().includes(search) ||
        row.url.toLowerCase().includes(search) ||
        (row.localizations ?? []).some((loc) =>
          loc.title?.toLowerCase().includes(search)
        )
      );
    },
    [search, category, title]
  );

  const paged = useClientPage(data, {
    page: list.page,
    limit: list.limit,
    filter,
  });

  const categories = Array.from(
    new Set((data ?? []).map((row) => row.category).filter(Boolean))
  ) as string[];

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteVideo.mutateAsync(toDelete.id);
      toast.success(t("videos.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: DataColumn<AdminVideoRow>[] = [
    {
      key: "title",
      header: t("videos.colTitle"),
      cell: (row) => (
        <div className="min-w-0 max-w-xl">
          <p className="truncate font-semibold text-gray-900">{title(row)}</p>
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 truncate text-xs text-gray-500 hover:text-brand-green"
            dir="ltr"
          >
            {row.url}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      ),
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
              href: adminPaths.websiteVideo(row.id),
              hidden: !can("WEBSITE", "edit"),
            },
            {
              key: "open",
              label: t("videos.openVideo"),
              icon: ExternalLink,
              externalHref: row.url,
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
        title={t("nav.videos")}
        description={t("website.videosSubtitle")}
        actions={
          <>
            <PrintButton allOnScreen />
            {can("WEBSITE", "create") && (
              <Button asChild>
                <Link href={adminPaths.websiteVideoNew}>
                  <Plus />
                  {t("videos.add")}
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
            placeholder={t("website.searchVideos")}
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
        rows={paged.rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onRowClick={
          can("WEBSITE", "edit")
            ? (row) => router.push(adminPaths.websiteVideo(row.id))
            : undefined
        }
        filtered={list.activeFilterCount > 0}
        pagination={
          <Pagination
            meta={paged.meta}
            onPageChange={list.setPage}
            onLimitChange={list.setLimit}
          />
        }
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("videos.deleteTitle")}
        description={t("website.deleteText", {
          name: toDelete ? title(toDelete) : "",
        })}
        loading={deleteVideo.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
