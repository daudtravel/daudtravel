"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useRouter } from "@/src/i18n/routing";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import SelectField from "@/src/components/admin/form/SelectField";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useBooking, useSaveBooking } from "@/src/hooks/admin/useBookings";
import { bookingsApi } from "@/src/services/admin/bookings.service";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  formatNumber,
  fullName,
  todayDateOnly,
} from "@/src/utlis/admin/format";
import { computeBookingTotals } from "@/src/utlis/admin/bookingTotals";
import { adminPaths } from "@/src/utlis/admin/paths";
import {
  CURRENCIES,
  type CurrencyCode,
} from "@/src/types/admin/currency.types";
import {
  ALLOWED_ITEM_TYPES,
  BOOKING_STATUSES,
  BOOKING_TYPES,
  type BookingCommissionPayload,
  type BookingItemPayload,
  type BookingStatus,
  type BookingType,
} from "@/src/types/admin/bookings.types";
import BookingItemsField, { presetItems } from "./BookingItemsField";
import BookingCommissionsField, {
  emptyCommission,
} from "./BookingCommissionsField";
import { cn } from "@/src/utlis/cn";

interface FormState {
  type: BookingType;
  status: BookingStatus;
  touristName: string;
  touristPhone: string;
  touristEmail: string;
  touristCountry: string;
  adults: string;
  children: string;
  startDate: string;
  endDate: string;
  currency: CurrencyCode;
  paidAmount: string;
  paymentMethod: string;
  referrerId: string;
  notes: string;
  createdById: string;
}

const EMPTY: FormState = {
  type: "HOTEL",
  status: "PENDING",
  touristName: "",
  touristPhone: "",
  touristEmail: "",
  touristCountry: "",
  adults: "1",
  children: "0",
  startDate: todayDateOnly(),
  endDate: "",
  currency: "GEL",
  paidAmount: "",
  paymentMethod: "",
  referrerId: "",
  notes: "",
  createdById: "",
};

function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function BookingFormView({ id }: { id?: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();
  const saveBooking = useSaveBooking();

  const editing = !!id;
  const { data: booking, isLoading } = useBooking(id ?? "", editing);

  // Creating from a paid website order
  const orderType = searchParams.get("orderType") as "TOUR" | "TRANSFER" | null;
  const orderId = searchParams.get("orderId");
  const draft = useQuery({
    queryKey: ["admin", "bookings", "draft", orderType, orderId],
    queryFn: () => bookingsApi.draftFromOrder(orderType!, orderId!),
    enabled: !editing && !!orderType && !!orderId,
    retry: false,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [items, setItems] = useState<BookingItemPayload[]>(
    presetItems("HOTEL")
  );
  const [commissions, setCommissions] = useState<BookingCommissionPayload[]>(
    []
  );
  const [orderLink, setOrderLink] = useState<{
    tourOrderId?: string;
    transferOrderId?: string;
  }>({});
  const [loaded, setLoaded] = useState(false);

  const partners = usePartnerOptions();
  const drivers = useDriverOptions();
  const owners = useUsersLookup(false, canAll("BOOKINGS_HOTEL", "edit"));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load an existing booking into the form
  useEffect(() => {
    if (!editing || !booking || loaded) return;
    setForm({
      type: booking.type,
      status: booking.status,
      touristName: booking.touristName,
      touristPhone: booking.touristPhone ?? "",
      touristEmail: booking.touristEmail ?? "",
      touristCountry: booking.touristCountry ?? "",
      adults: String(booking.adults),
      children: String(booking.children),
      startDate: booking.startDate,
      endDate: booking.endDate ?? "",
      currency: booking.currency,
      paidAmount: String(booking.paidAmount ?? 0),
      paymentMethod: booking.paymentMethod ?? "",
      referrerId: booking.referrerId ?? "",
      notes: booking.notes ?? "",
      createdById: booking.createdById ?? "",
    });
    setItems(
      booking.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        hotelId: item.hotelId,
        roomNumber: item.roomNumber,
        roomType: item.roomType,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        tourId: item.tourId,
        driverId: item.driverId,
        vehicleId: item.vehicleId,
        serviceDate: item.serviceDate,
        salePrice: item.salePrice,
        costPrice: item.costPrice,
        supplierPaid: item.supplierPaid,
        notes: item.notes,
      }))
    );
    setCommissions(
      booking.commissions.map((commission) => ({
        id: commission.id,
        partnerId: commission.partnerId,
        recipientName: commission.recipientName,
        kind: commission.kind,
        driverId: commission.driverId,
        rate: commission.rate,
        amount: commission.amount,
        paid: commission.paid,
        note: commission.note,
      }))
    );
    setOrderLink({
      tourOrderId: booking.tourOrderId ?? undefined,
      transferOrderId: booking.transferOrderId ?? undefined,
    });
    setLoaded(true);
  }, [editing, booking, loaded]);

  // Prefill from a website order
  useEffect(() => {
    if (editing || !draft.data || loaded) return;
    const data = draft.data;
    setForm((prev) => ({
      ...prev,
      type: data.type,
      touristName: data.touristName,
      touristPhone: data.touristPhone ?? "",
      touristEmail: data.touristEmail ?? "",
      adults: String(data.adults),
      children: String(data.children),
      startDate: data.startDate,
      currency: data.currency,
      paidAmount: String(data.paidAmount),
      status: "CONFIRMED",
    }));
    setItems(data.items);
    setOrderLink({
      tourOrderId: data.tourOrderId,
      transferOrderId: data.transferOrderId,
    });
    setLoaded(true);
  }, [editing, draft.data, loaded]);

  useEffect(() => {
    if (draft.isError) toast.error(errorMessage(draft.error));
  }, [draft.isError, draft.error, errorMessage]);

  const totals = useMemo(
    () => computeBookingTotals(items, commissions),
    [items, commissions]
  );
  const paid = Number(form.paidAmount.replace(",", ".")) || 0;
  const due = Math.round((totals.totalPrice - paid) * 100) / 100;

  /** Switching type resets the preset lines of an empty booking. */
  const onTypeChange = (next: BookingType) => {
    set("type", next);
    const allowed = ALLOWED_ITEM_TYPES[next];
    const untouched =
      items.length === 0 ||
      items.every(
        (item) =>
          !item.title.trim() && !item.salePrice && !item.costPrice && !item.id
      );
    if (untouched) {
      setItems(presetItems(next));
    } else {
      // Keep the lines that still make sense, move the rest to "other"
      setItems(
        items.map((item) =>
          allowed.includes(item.type) ? item : { ...item, type: "OTHER" }
        )
      );
    }
  };

  /** Choosing who brought the client offers their commission row. */
  const onReferrerChange = (partnerId: string) => {
    set("referrerId", partnerId);
    if (!partnerId) return;
    const partner = partners.data?.find((p) => p.id === partnerId);
    const exists = commissions.some(
      (commission) =>
        commission.kind === "CLIENT_REFERRAL" &&
        commission.partnerId === partnerId
    );
    if (partner && !exists) {
      setCommissions((prev) => [
        ...prev,
        {
          ...emptyCommission("CLIENT_REFERRAL"),
          partnerId: partner.id,
          recipientName: partner.name,
          rate: partner.commissionRate,
        },
      ]);
    }
  };

  /** A driver who was brought by a partner earns that partner a commission. */
  const driverReferralSuggestion = useMemo(() => {
    const driverIds = [
      ...new Set(items.map((item) => item.driverId).filter(Boolean)),
    ] as string[];
    for (const driverId of driverIds) {
      const driver = drivers.data?.find((d) => d.id === driverId);
      if (!driver?.referrerId) continue;
      const exists = commissions.some(
        (commission) =>
          commission.kind === "DRIVER_REFERRAL" &&
          commission.driverId === driverId
      );
      if (!exists) return driver;
    }
    return null;
  }, [items, drivers.data, commissions]);

  const addDriverReferral = () => {
    if (!driverReferralSuggestion) return;
    setCommissions((prev) => [
      ...prev,
      {
        ...emptyCommission("DRIVER_REFERRAL"),
        partnerId: driverReferralSuggestion.referrerId,
        recipientName: driverReferralSuggestion.referrer?.name ?? null,
        driverId: driverReferralSuggestion.id,
        rate: driverReferralSuggestion.referrerCommissionRate,
      },
    ]);
  };

  const submit = async () => {
    if (!form.touristName.trim()) {
      toast.error(t("bookings.touristRequired"));
      return;
    }
    if (!form.startDate) {
      toast.error(t("bookings.startDateRequired"));
      return;
    }
    if (items.some((item) => !item.title.trim())) {
      toast.error(t("bookings.itemTitleRequired"));
      return;
    }

    try {
      const saved = await saveBooking.mutateAsync({
        id,
        payload: {
          type: form.type,
          status: form.status,
          touristName: form.touristName.trim(),
          touristPhone: form.touristPhone.trim() || null,
          touristEmail: form.touristEmail.trim() || null,
          touristCountry: form.touristCountry.trim() || null,
          adults: Number(form.adults) || 0,
          children: Number(form.children) || 0,
          startDate: form.startDate,
          endDate: form.endDate || null,
          currency: form.currency,
          paidAmount: paid,
          paymentMethod: form.paymentMethod.trim() || null,
          referrerId: form.referrerId || null,
          notes: form.notes.trim() || null,
          ...(orderLink.tourOrderId && { tourOrderId: orderLink.tourOrderId }),
          ...(orderLink.transferOrderId && {
            transferOrderId: orderLink.transferOrderId,
          }),
          items: items.map((item, index) => ({
            ...item,
            title: item.title.trim(),
            salePrice: Number(item.salePrice ?? 0) || 0,
            costPrice: Number(item.costPrice ?? 0) || 0,
            sortOrder: index,
          })),
          commissions: commissions.map((commission) => ({
            ...commission,
            recipientName:
              commission.recipientName ??
              partners.data?.find((p) => p.id === commission.partnerId)?.name ??
              null,
            amount:
              commission.rate === null || commission.rate === undefined
                ? Number(commission.amount ?? 0) || 0
                : null,
          })),
          ...(canAll("BOOKINGS_HOTEL", "edit") &&
            form.createdById && { createdById: form.createdById }),
        },
      });
      toast.success(editing ? t("bookings.updated") : t("bookings.created"));
      router.push(adminPaths.booking(saved.id));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (editing && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const canPickType = BOOKING_TYPES.filter((type) =>
    can(
      type === "HOTEL"
        ? "BOOKINGS_HOTEL"
        : type === "PACKAGE"
          ? "BOOKINGS_PACKAGE"
          : "BOOKINGS_TOUR",
      editing ? "edit" : "create"
    )
  );

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={
          editing
            ? t("bookings.editTitle", { number: booking?.number ?? "" })
            : t("bookings.new")
        }
        description={t("bookings.formHint")}
        backHref={editing && id ? adminPaths.booking(id) : adminPaths.bookings}
        backLabel={editing ? t("bookings.booking") : t("nav.bookings")}
      />

      <Panel title={t("bookings.tourist")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label={t("common.type")}
            value={form.type}
            onChange={(value) => onTypeChange(value as BookingType)}
            options={canPickType.map((type) => ({
              value: type,
              label: t(`bookings.types.${type}`),
            }))}
            required
          />
          <SelectField
            label={t("common.status")}
            value={form.status}
            onChange={(value) => set("status", value as BookingStatus)}
            options={BOOKING_STATUSES.map((status) => ({
              value: status,
              label: t(`bookings.statuses.${status}`),
            }))}
          />
          <Field label={t("bookings.touristName")}>
            <Input
              value={form.touristName}
              onChange={(e) => set("touristName", e.target.value)}
              maxLength={160}
              className={adminInputClass}
            />
          </Field>
          <Field label={t("users.phone")}>
            <Input
              value={form.touristPhone}
              onChange={(e) => set("touristPhone", e.target.value)}
              maxLength={40}
              dir="ltr"
              className={adminInputClass}
            />
          </Field>
          <Field label={t("users.email")}>
            <Input
              value={form.touristEmail}
              onChange={(e) => set("touristEmail", e.target.value)}
              maxLength={254}
              dir="ltr"
              className={adminInputClass}
            />
          </Field>
          <Field label={t("bookings.country")}>
            <Input
              value={form.touristCountry}
              onChange={(e) => set("touristCountry", e.target.value)}
              maxLength={80}
              className={adminInputClass}
            />
          </Field>
          <Field label={t("bookings.adults")}>
            <Input
              value={form.adults}
              onChange={(e) => set("adults", e.target.value)}
              inputMode="numeric"
              className={adminInputClass}
            />
          </Field>
          <Field label={t("bookings.children")}>
            <Input
              value={form.children}
              onChange={(e) => set("children", e.target.value)}
              inputMode="numeric"
              className={adminInputClass}
            />
          </Field>
          <Field label={t("bookings.startDate")}>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className={adminInputClass}
            />
          </Field>
          <Field label={t("bookings.endDate")}>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className={adminInputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel title={t("bookings.items")} description={t("bookings.itemsHint")}>
        <BookingItemsField
          bookingType={form.type}
          value={items}
          onChange={setItems}
          currency={form.currency}
          disabled={saveBooking.isPending}
        />
      </Panel>

      <Panel
        title={t("bookings.commissions")}
        description={t("bookings.commissionsHint")}
      >
        {driverReferralSuggestion && (
          <button
            type="button"
            onClick={addDriverReferral}
            className="mb-3 flex w-full items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green-50 px-3 py-2 text-start text-sm text-brand-green transition-colors hover:bg-brand-green-100"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("bookings.driverReferralSuggestion", {
              driver: fullName(driverReferralSuggestion),
              partner: driverReferralSuggestion.referrer?.name ?? "",
            })}
          </button>
        )}
        <BookingCommissionsField
          value={commissions}
          onChange={setCommissions}
          amounts={totals.commissionAmounts}
          currency={form.currency}
          disabled={saveBooking.isPending}
        />
      </Panel>

      <Panel title={t("bookings.payment")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label={t("hotels.currency")}
            value={form.currency}
            onChange={(value) => set("currency", value as CurrencyCode)}
            options={CURRENCIES.map((currency) => ({
              value: currency,
              label: currency,
            }))}
          />
          <Field label={t("bookings.paidAmount")}>
            <Input
              value={form.paidAmount}
              onChange={(e) => set("paidAmount", e.target.value)}
              inputMode="decimal"
              className={cn(adminInputClass, "text-end tabular-nums")}
            />
          </Field>
          <Field label={t("bookings.paymentMethod")}>
            <Input
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
              maxLength={60}
              className={adminInputClass}
            />
          </Field>
          <SelectField
            label={t("bookings.referrer")}
            value={form.referrerId}
            onChange={onReferrerChange}
            emptyLabel={t("drivers.noReferrer")}
            options={(partners.data ?? []).map((partner) => ({
              value: partner.id,
              label: partner.name,
            }))}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("common.notes")}>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              maxLength={4000}
              className="rounded-xl border-gray-200"
            />
          </Field>
          {canAll("BOOKINGS_HOTEL", "edit") && (
            <SelectField
              label={t("common.owner")}
              value={form.createdById}
              onChange={(value) => set("createdById", value)}
              emptyLabel={t("common.me")}
              options={(owners.data ?? []).map((owner) => ({
                value: owner.id,
                label: fullName(owner),
              }))}
            />
          )}
        </div>
      </Panel>

      {/* Live totals; the server recomputes them on save */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {[
              ["bookings.totalPrice", totals.totalPrice, "text-gray-900"],
              ["bookings.totalCost", totals.totalCost, "text-gray-600"],
              [
                "bookings.totalCommission",
                totals.totalCommission,
                "text-gray-600",
              ],
              [
                "bookings.profit",
                totals.profit,
                totals.profit < 0 ? "text-red-600" : "text-brand-green",
              ],
              ["bookings.paidAmount", paid, "text-gray-600"],
              [
                "bookings.balanceDue",
                due,
                due > 0 ? "text-amber-600" : "text-gray-400",
              ],
            ].map(([key, amount, tone]) => (
              <div key={key as string}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t(key as string)}
                </dt>
                <dd className={cn("font-bold tabular-nums", tone as string)}>
                  {formatNumber(amount as number, locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {form.currency}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saveBooking.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={saveBooking.isPending}
            >
              {saveBooking.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              {t("common.save")}
            </Button>
          </div>
        </div>
        {totals.profit < 0 && (
          <p className="mt-1 text-xs font-medium text-red-600">
            {t("bookings.negativeProfit")}
          </p>
        )}
      </div>
    </div>
  );
}
