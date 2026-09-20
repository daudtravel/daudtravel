"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, MapPin, Pencil, Star, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Link, useRouter } from "@/src/i18n/routing";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import Panel from "@/src/components/admin/common/Panel";
import { useHotel } from "@/src/hooks/admin/useHotels";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { formatDate, formatNumber, fullName } from "@/src/utlis/admin/format";
import { adminPaths } from "@/src/utlis/admin/paths";
import HotelFormDialog from "./HotelFormDialog";
import { ContactLinks } from "./HotelsListView";

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

export default function HotelDetailView({ id }: { id: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { can } = usePermissions();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const { data: hotel, isLoading, isError } = useHotel(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !hotel) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="font-semibold text-gray-800">{t("errors.NOT_FOUND")}</p>
          <Link
            href={adminPaths.hotels}
            className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline"
          >
            {t("nav.hotels")}
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={hotel.name}
        description={t("hotels.detailSubtitle")}
        backHref={adminPaths.hotels}
        backLabel={t("nav.hotels")}
        printTitle={hotel.name}
        actions={
          <>
            <PrintButton />
            {can("TRANSACTIONS", "create") && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    adminPaths.transactionNew({ hotelId: id, type: "EXPENSE" })
                  )
                }
              >
                <Wallet />
                {t("transactions.addExpense")}
              </Button>
            )}
            {can("HOTELS", "edit") && (
              <Button onClick={() => setEditOpen(true)}>
                <Pencil />
                {t("common.edit")}
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{hotel.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              {[hotel.address, hotel.city, hotel.region]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={hotel.isActive ? "green" : "neutral"}>
                {hotel.isActive ? t("users.active") : t("users.inactive")}
              </Badge>
              <Badge tone="neutral">
                {t(`hotels.categories.${hotel.category}`)}
              </Badge>
              {hotel.stars !== null && (
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.stars }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow"
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("hotels.priceFrom")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                {hotel.priceFrom !== null
                  ? `${formatNumber(hotel.priceFrom, locale)} ${hotel.priceCurrency ?? ""}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("hotels.commissionRate")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                {hotel.commissionRate !== null
                  ? `${formatNumber(hotel.commissionRate, locale)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={t("hotels.contacts")}
        description={t("hotels.contactsHint")}
      >
        {hotel.contacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            {t("hotels.noContacts")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {hotel.contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                  {t(`hotels.contactTypes.${contact.type}`)}
                </p>
                {contact.name && (
                  <p className="text-sm font-semibold text-gray-900">
                    {contact.name}
                  </p>
                )}
                <div className="mt-1 text-sm">
                  <ContactLinks contact={contact} />
                </div>
                {contact.note && (
                  <p className="mt-1 text-xs text-gray-500">{contact.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t("hotels.details")}>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("hotels.city")}>{hotel.city}</Field>
          <Field label={t("hotels.region")}>
            {hotel.region ?? <span className="text-gray-300">—</span>}
          </Field>
          <Field label={t("hotels.address")}>
            {hotel.address ?? <span className="text-gray-300">—</span>}
          </Field>
          <Field label={t("hotels.website")}>
            {hotel.website ? (
              <a
                href={hotel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-brand-green hover:underline"
                dir="ltr"
              >
                {hotel.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </Field>
          <Field label={t("common.owner")}>
            {hotel.createdBy ? (
              fullName(hotel.createdBy)
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </Field>
          <Field label={t("common.createdAt")}>
            {formatDate(hotel.createdAt, locale)}
          </Field>
          <Field label={t("common.updatedAt")}>
            {formatDate(hotel.updatedAt, locale)}
          </Field>
        </dl>

        {hotel.notes && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("common.notes")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
              {hotel.notes}
            </p>
          </div>
        )}
      </Panel>

      <HotelFormDialog
        open={editOpen}
        hotel={hotel}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
