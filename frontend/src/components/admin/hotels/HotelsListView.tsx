"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Eye,
  Mail,
  MapPin,
  MessageCircle,
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
  useDeleteHotel,
  useHotelFilterOptions,
  useHotels,
} from "@/src/hooks/admin/useHotels";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { hotelsApi } from "@/src/services/admin/hotels.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatNumber, fullName } from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useRouter } from "@/src/i18n/routing";
import {
  HOTEL_CATEGORIES,
  type Hotel,
  type HotelContact,
} from "@/src/types/admin/hotels.types";
import HotelFormDialog from "./HotelFormDialog";

const FILTERS = [
  "search",
  "city",
  "region",
  "category",
  "stars",
  "hasCommission",
  "isActive",
  "createdById",
  "minPrice",
  "maxPrice",
] as const;

/** Phone numbers are also reachable on WhatsApp, which the office uses a lot. */
export function ContactLinks({
  contact,
  compact = false,
}: {
  contact: HotelContact;
  compact?: boolean;
}) {
  const whatsapp = contact.phone?.replace(/[^\d]/g, "");
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {contact.phone && (
        <span className="flex items-center gap-1.5">
          <a
            href={`tel:${contact.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
            dir="ltr"
          >
            <Phone className="h-3 w-3 shrink-0 text-gray-400" />
            {contact.phone}
          </a>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-green-600 hover:text-green-700 print:hidden"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
        </span>
      )}
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
          dir="ltr"
        >
          <Mail className="h-3 w-3 shrink-0 text-gray-400" />
          {contact.email}
        </a>
      )}
    </div>
  );
}

export default function HotelsListView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const list = useListQuery({
    filters: FILTERS,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });
  const { data, isLoading, isError, refetch } = useHotels(list.params);
  const deleteHotel = useDeleteHotel();
  const filterOptions = useHotelFilterOptions();
  const owners = useUsersLookup(true, canAll("HOTELS", "view"));

  const [editing, setEditing] = useState<Hotel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Hotel | null>(null);

  const fetchAll = useCallback(
    (limit: number) => hotelsApi.list({ ...list.params, page: 1, limit }),
    [list.params]
  );
  const { printRows, printAll } = usePrintAll(fetchAll);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (hotel: Hotel) => {
    setEditing(hotel);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteHotel.mutateAsync(toDelete.id);
      toast.success(t("hotels.deleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
      setToDelete(null);
    }
  };

  const columns: DataColumn<Hotel>[] = [
    {
      key: "name",
      header: t("hotels.hotel"),
      sortKey: "name",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{row.name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {row.city}
            {row.region ? `, ${row.region}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: t("hotels.category"),
      cell: (row) => (
        <div className="space-y-1">
          <Badge tone="neutral">{t(`hotels.categories.${row.category}`)}</Badge>
          {row.stars !== null && (
            <p className="flex items-center gap-0.5 text-xs text-gray-500">
              {Array.from({ length: row.stars }).map((_, index) => (
                <Star
                  key={index}
                  className="h-3 w-3 fill-brand-yellow text-brand-yellow"
                />
              ))}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "contacts",
      header: t("hotels.contacts"),
      cell: (row) =>
        row.contacts.length ? (
          <div className="space-y-1 text-sm">
            {row.contacts.slice(0, 2).map((contact) => (
              <div key={contact.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t(`hotels.contactTypes.${contact.type}`)}
                  {contact.name ? ` · ${contact.name}` : ""}
                </p>
                <ContactLinks contact={contact} compact />
              </div>
            ))}
            {row.contacts.length > 2 && (
              <p className="text-xs text-gray-400">
                {t("list.more", { count: row.contacts.length - 2 })}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">
            {t("hotels.noContacts")}
          </span>
        ),
    },
    {
      key: "priceFrom",
      header: t("hotels.priceFrom"),
      sortKey: "priceFrom",
      align: "end",
      hideOnMobile: true,
      cell: (row) =>
        row.priceFrom !== null ? (
          <span className="whitespace-nowrap font-semibold tabular-nums">
            {formatNumber(row.priceFrom, locale)} {row.priceCurrency ?? ""}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "commissionRate",
      header: t("hotels.commissionRate"),
      sortKey: "commissionRate",
      align: "end",
      hideOnMobile: true,
      cell: (row) =>
        row.commissionRate !== null ? (
          <span className="font-semibold tabular-nums">
            {formatNumber(row.commissionRate, locale)}%
          </span>
        ) : (
          <span className="text-gray-300">—</span>
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
              href: adminPaths.hotel(row.id),
            },
            {
              key: "edit",
              label: t("common.edit"),
              icon: Pencil,
              onSelect: () => openEdit(row),
              hidden: !can("HOTELS", "edit"),
            },
            {
              key: "website",
              label: t("hotels.openWebsite"),
              icon: Eye,
              externalHref: row.website ?? undefined,
              hidden: !row.website,
            },
            {
              key: "delete",
              label: t("common.delete"),
              icon: Trash2,
              danger: true,
              separated: true,
              onSelect: () => setToDelete(row),
              hidden: !can("HOTELS", "delete"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("nav.hotels")}
        description={t("hotels.subtitle")}
        actions={
          <>
            <PrintButton
              onPrintAll={printAll}
              allOnScreen={(data?.meta.total ?? 0) <= (data?.data.length ?? 0)}
            />
            {can("HOTELS", "create") && (
              <Button onClick={openCreate}>
                <Plus />
                {t("hotels.new")}
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
            placeholder={t("hotels.searchPlaceholder")}
          />
        }
      >
        <SelectFilter
          label={t("hotels.city")}
          value={list.values.city}
          onChange={(v) => list.setFilter("city", v)}
          options={(filterOptions.data?.cities ?? []).map((city) => ({
            value: city,
            label: city,
          }))}
        />
        <SelectFilter
          label={t("hotels.region")}
          value={list.values.region}
          onChange={(v) => list.setFilter("region", v)}
          options={(filterOptions.data?.regions ?? []).map((region) => ({
            value: region,
            label: region,
          }))}
        />
        <SelectFilter
          label={t("hotels.category")}
          value={list.values.category}
          onChange={(v) => list.setFilter("category", v)}
          options={HOTEL_CATEGORIES.map((category) => ({
            value: category,
            label: t(`hotels.categories.${category}`),
          }))}
        />
        <SelectFilter
          label={t("hotels.stars")}
          value={list.values.stars}
          onChange={(v) => list.setFilter("stars", v)}
          options={[5, 4, 3, 2, 1].map((stars) => ({
            value: String(stars),
            label: "★".repeat(stars),
          }))}
        />
        <SelectFilter
          label={t("hotels.commissionRate")}
          value={list.values.hasCommission}
          onChange={(v) => list.setFilter("hasCommission", v)}
          options={[
            { value: "true", label: t("hotels.withCommission") },
            { value: "false", label: t("hotels.withoutCommission") },
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
          label={t("hotels.priceFrom")}
          min={list.values.minPrice}
          max={list.values.maxPrice}
          onChange={(min, max) =>
            list.setFilters({ minPrice: min, maxPrice: max })
          }
        />
        {canAll("HOTELS", "view") && (
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
        onRowClick={(row) => router.push(adminPaths.hotel(row.id))}
        filtered={list.activeFilterCount > 0}
        rowClassName={(row) => (!row.isActive ? "opacity-60" : undefined)}
        emptyAction={
          can("HOTELS", "create") && list.activeFilterCount === 0 ? (
            <Button onClick={openCreate}>
              <Plus />
              {t("hotels.new")}
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

      <HotelFormDialog
        open={formOpen}
        hotel={editing}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("hotels.deleteTitle")}
        description={t("hotels.deleteText", { name: toDelete?.name ?? "" })}
        loading={deleteHotel.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
