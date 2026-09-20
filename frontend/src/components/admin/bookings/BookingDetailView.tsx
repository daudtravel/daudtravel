"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Building2,
  Car,
  CheckCircle2,
  FileText,
  Mail,
  Pencil,
  Phone,
  Printer,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Link, useRouter } from "@/src/i18n/routing";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import {
  useBooking,
  useBookingStatus,
  useCommissionPaid,
  useDeleteBooking,
  useSupplierPaid,
} from "@/src/hooks/admin/useBookings";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  formatDateOnly,
  formatNumber,
  fullName,
} from "@/src/utlis/admin/format";
import { adminPaths } from "@/src/utlis/admin/paths";
import {
  BOOKING_STATUSES,
  type Booking,
  type BookingStatus,
} from "@/src/types/admin/bookings.types";
import { cn } from "@/src/utlis/cn";

export function bookingNumber(booking: { number: number }) {
  return `BK-${String(booking.number).padStart(6, "0")}`;
}

export const STATUS_TONE: Record<
  BookingStatus,
  "green" | "yellow" | "neutral" | "red"
> = {
  PENDING: "yellow",
  CONFIRMED: "green",
  COMPLETED: "neutral",
  CANCELLED: "red",
};

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

export default function BookingDetailView({ id }: { id: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();

  const { data: booking, isLoading, isError } = useBooking(id);
  const changeStatus = useBookingStatus();
  const supplierPaid = useSupplierPaid();
  const commissionPaid = useCommissionPaid();
  const deleteBooking = useDeleteBooking();

  const [toDelete, setToDelete] = useState(false);
  /** The voucher leaves out what we pay and what we keep. */
  const [printMode, setPrintMode] = useState<"internal" | "voucher">(
    "internal"
  );
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    const done = () => {
      setPrinting(false);
      setPrintMode("internal");
    };
    window.addEventListener("afterprint", done, { once: true });
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const print = useCallback((mode: "internal" | "voucher") => {
    setPrintMode(mode);
    setPrinting(true);
  }, []);

  const money = useCallback(
    (amount: number, currency: string) =>
      `${formatNumber(amount, locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currency}`,
    [locale]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="font-semibold text-gray-800">{t("errors.NOT_FOUND")}</p>
          <Link
            href={adminPaths.bookings}
            className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline"
          >
            {t("nav.bookings")}
          </Link>
        </div>
      </Panel>
    );
  }

  const b: Booking = booking;
  const internalOnly = printMode === "voucher" ? "print:hidden" : undefined;

  const onStatus = async (status: BookingStatus) => {
    try {
      await changeStatus.mutateAsync({ id, status });
      toast.success(t("bookings.statusChanged"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteBooking.mutateAsync(id);
      toast.success(t("bookings.deleted"));
      router.push(adminPaths.bookings);
    } catch (error) {
      toast.error(errorMessage(error));
      setToDelete(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${bookingNumber(b)} · ${b.touristName}`}
        description={t(`bookings.types.${b.type}`)}
        backHref={adminPaths.bookings}
        backLabel={t("nav.bookings")}
        printTitle={`${bookingNumber(b)} — ${b.touristName}`}
        actions={
          <>
            <Button variant="outline" onClick={() => print("voucher")}>
              <FileText />
              {t("bookings.printVoucher")}
            </Button>
            <Button variant="outline" onClick={() => print("internal")}>
              <Printer />
              {t("bookings.printInternal")}
            </Button>
            {can("TRANSACTIONS", "create") && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    adminPaths.transactionNew({
                      bookingId: id,
                      type: "EXPENSE",
                    })
                  )
                }
              >
                <Wallet />
                {t("transactions.addExpense")}
              </Button>
            )}
            {can("BOOKINGS_HOTEL", "edit") ||
            can("BOOKINGS_TOUR", "edit") ||
            can("BOOKINGS_PACKAGE", "edit") ? (
              <Button onClick={() => router.push(adminPaths.bookingEdit(id))}>
                <Pencil />
                {t("common.edit")}
              </Button>
            ) : null}
          </>
        }
      />

      {/* Summary */}
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                {b.touristName}
              </h2>
              <Badge tone={STATUS_TONE[b.status]}>
                {t(`bookings.statuses.${b.status}`)}
              </Badge>
              <Badge tone="neutral">{t(`bookings.types.${b.type}`)}</Badge>
              {b.source === "website" && (
                <Badge tone="yellow">{t("bookings.fromWebsite")}</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {b.touristPhone && (
                <a
                  href={`tel:${b.touristPhone}`}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
                  dir="ltr"
                >
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {b.touristPhone}
                </a>
              )}
              {b.touristEmail && (
                <a
                  href={`mailto:${b.touristEmail}`}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
                  dir="ltr"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {b.touristEmail}
                </a>
              )}
              <span className="flex items-center gap-1.5 text-gray-700">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {t("bookings.guests", {
                  adults: b.adults,
                  children: b.children,
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {formatDateOnly(b.startDate, locale)}
              {b.endDate ? ` — ${formatDateOnly(b.endDate, locale)}` : ""}
              {b.touristCountry ? ` · ${b.touristCountry}` : ""}
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.totalPrice")}
              </dt>
              <dd className="text-lg font-bold tabular-nums text-gray-900">
                {money(b.totalPrice, b.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.paidAmount")}
              </dt>
              <dd className="text-lg font-bold tabular-nums text-gray-900">
                {money(b.paidAmount, b.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.balanceDue")}
              </dt>
              <dd
                className={cn(
                  "text-lg font-bold tabular-nums",
                  b.balanceDue > 0 ? "text-amber-600" : "text-gray-400"
                )}
              >
                {money(b.balanceDue, b.currency)}
              </dd>
            </div>
            <div className={internalOnly}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.profit")}
              </dt>
              <dd
                className={cn(
                  "text-lg font-bold tabular-nums",
                  b.profit < 0 ? "text-red-600" : "text-brand-green"
                )}
              >
                {money(b.profit, b.currency)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Status actions */}
        {(can("BOOKINGS_HOTEL", "edit") ||
          can("BOOKINGS_TOUR", "edit") ||
          can("BOOKINGS_PACKAGE", "edit")) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 print:hidden">
            {BOOKING_STATUSES.filter((status) => status !== b.status).map(
              (status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={changeStatus.isPending}
                  onClick={() => void onStatus(status)}
                >
                  {t(`bookings.setStatus.${status}`)}
                </Button>
              )
            )}
            {can("BOOKINGS_HOTEL", "delete") ||
            can("BOOKINGS_TOUR", "delete") ||
            can("BOOKINGS_PACKAGE", "delete") ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setToDelete(true)}
              >
                <Trash2 />
                {t("common.delete")}
              </Button>
            ) : null}
          </div>
        )}
      </Panel>

      {/* Lines */}
      <Panel title={t("bookings.items")} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-start">{t("bookings.item")}</th>
                <th className="px-5 py-3 text-start">
                  {t("bookings.details")}
                </th>
                <th className="px-5 py-3 text-end">
                  {t("bookings.salePrice")}
                </th>
                <th className={cn("px-5 py-3 text-end", internalOnly)}>
                  {t("bookings.costPrice")}
                </th>
                <th className={cn("px-5 py-3 text-end", internalOnly)}>
                  {t("bookings.itemProfit")}
                </th>
                <th className={cn("px-5 py-3 text-center", internalOnly)}>
                  {t("bookings.supplierPaid")}
                </th>
              </tr>
            </thead>
            <tbody>
              {b.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {t(`bookings.itemTypes.${item.type}`)}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {item.hotel && (
                      <p className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        {item.hotel.name}
                        {item.roomNumber
                          ? ` · ${t("bookings.roomNumber")} ${item.roomNumber}`
                          : ""}
                      </p>
                    )}
                    {(item.checkIn || item.checkOut) && (
                      <p>
                        {formatDateOnly(item.checkIn, locale)} →{" "}
                        {formatDateOnly(item.checkOut, locale)}
                      </p>
                    )}
                    {item.driver && (
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        {fullName(item.driver)}
                      </p>
                    )}
                    {item.vehicle && (
                      <p className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-gray-400" />
                        {item.vehicle.brand} {item.vehicle.model}
                        {item.vehicle.year ? ` · ${item.vehicle.year}` : ""}
                      </p>
                    )}
                    {item.serviceDate && (
                      <p>{formatDateOnly(item.serviceDate, locale)}</p>
                    )}
                    {item.notes && <p className="italic">{item.notes}</p>}
                  </td>
                  <td className="px-5 py-3 text-end font-semibold tabular-nums">
                    {money(item.salePrice, b.currency)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-3 text-end tabular-nums text-gray-600",
                      internalOnly
                    )}
                  >
                    {money(item.costPrice, b.currency)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-3 text-end font-semibold tabular-nums",
                      item.profit < 0 ? "text-red-600" : "text-gray-700",
                      internalOnly
                    )}
                  >
                    {money(item.profit, b.currency)}
                  </td>
                  <td className={cn("px-5 py-3 text-center", internalOnly)}>
                    {can("BOOKINGS_HOTEL", "edit") ||
                    can("BOOKINGS_TOUR", "edit") ||
                    can("BOOKINGS_PACKAGE", "edit") ? (
                      <Switch
                        checked={item.supplierPaid}
                        disabled={supplierPaid.isPending}
                        onCheckedChange={(checked) =>
                          supplierPaid
                            .mutateAsync({ itemId: item.id, paid: checked })
                            .catch((error) => toast.error(errorMessage(error)))
                        }
                        aria-label={t("bookings.supplierPaid")}
                        className="print:hidden"
                      />
                    ) : (
                      <span>{item.supplierPaid ? "✓" : "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-5 py-3" colSpan={2}>
                  {t("common.total")}
                </td>
                <td className="px-5 py-3 text-end tabular-nums">
                  {money(b.totalPrice, b.currency)}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-end tabular-nums",
                    internalOnly
                  )}
                >
                  {money(b.totalCost, b.currency)}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-end tabular-nums",
                    internalOnly
                  )}
                  colSpan={2}
                >
                  {money(b.totalPrice - b.totalCost, b.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      {/* Commissions */}
      {b.commissions.length > 0 && (
        <div className={internalOnly}>
          <Panel
            title={t("bookings.commissions")}
            description={t("bookings.commissionsHint")}
            noPadding
          >
            <ul className="divide-y divide-gray-50">
              {b.commissions.map((commission) => (
                <li
                  key={commission.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {commission.partner?.name ?? commission.recipientName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(`bookings.commissionKinds.${commission.kind}`)}
                      {commission.driver
                        ? ` · ${fullName(commission.driver)}`
                        : ""}
                      {commission.rate !== null
                        ? ` · ${formatNumber(commission.rate, locale)}%`
                        : ""}
                      {commission.note ? ` · ${commission.note}` : ""}
                    </p>
                  </div>
                  <p className="font-bold tabular-nums text-gray-900">
                    {money(commission.amount, b.currency)}
                  </p>
                  {can("BOOKINGS_HOTEL", "edit") ||
                  can("BOOKINGS_TOUR", "edit") ||
                  can("BOOKINGS_PACKAGE", "edit") ? (
                    <label className="flex items-center gap-2 text-xs text-gray-600 print:hidden">
                      <Switch
                        checked={commission.paid}
                        disabled={commissionPaid.isPending}
                        onCheckedChange={(checked) =>
                          commissionPaid
                            .mutateAsync({
                              commissionId: commission.id,
                              paid: checked,
                            })
                            .catch((error) => toast.error(errorMessage(error)))
                        }
                        aria-label={t("bookings.commissionPaid")}
                      />
                      {t("bookings.commissionPaid")}
                    </label>
                  ) : (
                    commission.paid && (
                      <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    )
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-between bg-gray-50 px-5 py-3 font-bold">
              <span>{t("bookings.totalCommission")}</span>
              <span className="tabular-nums">
                {money(b.totalCommission, b.currency)}
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* Details */}
      <Panel title={t("bookings.details")}>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("bookings.paymentMethod")}>
            {b.paymentMethod ?? <span className="text-gray-300">—</span>}
          </Field>
          <Field label={t("bookings.referrer")}>
            {b.referrer?.name ?? <span className="text-gray-300">—</span>}
          </Field>
          <div className={internalOnly}>
            <Field label={t("bookings.fxRate")}>
              {b.currency === "GEL"
                ? "—"
                : `1 ${b.currency} = ${formatNumber(b.fxRate, locale, {
                    maximumFractionDigits: 4,
                  })} GEL`}
            </Field>
          </div>
          <Field label={t("common.owner")}>
            {b.createdBy ? (
              fullName(b.createdBy)
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </Field>
        </dl>
        {b.notes && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("common.notes")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
              {b.notes}
            </p>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={toDelete}
        onOpenChange={setToDelete}
        title={t("bookings.deleteTitle")}
        description={t("bookings.deleteText", { number: bookingNumber(b) })}
        loading={deleteBooking.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
