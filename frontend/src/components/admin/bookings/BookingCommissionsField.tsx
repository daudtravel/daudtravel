"use client";

import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { formatNumber, fullName } from "@/src/utlis/admin/format";
import {
  COMMISSION_KINDS,
  type BookingCommissionPayload,
  type CommissionKind,
} from "@/src/types/admin/bookings.types";
import { cn } from "@/src/utlis/cn";

export const emptyCommission = (
  kind: CommissionKind = "CLIENT_REFERRAL"
): BookingCommissionPayload => ({
  kind,
  partnerId: null,
  rate: null,
  amount: null,
});

export default function BookingCommissionsField({
  value,
  onChange,
  amounts,
  currency,
  disabled,
}: {
  value: BookingCommissionPayload[];
  onChange: (value: BookingCommissionPayload[]) => void;
  /** Live amounts computed from the items (same rules as the API). */
  amounts: number[];
  currency: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const partners = usePartnerOptions();
  const drivers = useDriverOptions();

  const update = (index: number, patch: Partial<BookingCommissionPayload>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  /** Picking a partner offers their standard percentage. */
  const onPartnerChange = (index: number, partnerId: string) => {
    const partner = partners.data?.find((p) => p.id === partnerId);
    const row = value[index];
    update(index, {
      partnerId: partnerId || null,
      recipientName: partner?.name ?? row.recipientName ?? null,
      ...(partner &&
      (row.rate === null || row.rate === undefined) &&
      (row.amount === null || row.amount === undefined)
        ? { rate: partner.commissionRate }
        : {}),
    });
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
          {t("bookings.noCommissions")}
        </p>
      )}

      {value.map((commission, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-gray-50/50 p-3"
        >
          <div className="grid gap-2 lg:grid-cols-[11rem_1fr_1fr_8rem_8rem_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.commissionKind")}
              </span>
              <Select
                value={commission.kind}
                onValueChange={(next) =>
                  update(index, { kind: next as CommissionKind })
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`bookings.commissionKinds.${kind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.recipient")}
              </span>
              <Select
                value={commission.partnerId ?? "__none__"}
                onValueChange={(next) =>
                  onPartnerChange(index, next === "__none__" ? "" : next)
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__none__">
                    {t("bookings.noPartner")}
                  </SelectItem>
                  {(partners.data ?? []).map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {commission.kind === "DRIVER_REFERRAL" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("bookings.commissionDriver")}
                </span>
                <Select
                  value={commission.driverId ?? "__none__"}
                  onValueChange={(next) =>
                    update(index, {
                      driverId: next === "__none__" ? null : next,
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">
                      {t("vehicles.noDriver")}
                    </SelectItem>
                    {(drivers.data ?? []).map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {fullName(driver)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("common.notes")}
                </span>
                <Input
                  value={commission.note ?? ""}
                  onChange={(e) => update(index, { note: e.target.value })}
                  disabled={disabled}
                  maxLength={300}
                  className={cn(adminInputClass, "h-10 bg-white")}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("bookings.rate")}
              </span>
              <Input
                value={commission.rate ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  update(index, {
                    rate: raw.trim() === "" ? null : Number(raw),
                    ...(raw.trim() !== "" ? { amount: null } : {}),
                  });
                }}
                inputMode="decimal"
                placeholder="%"
                disabled={disabled}
                className={cn(adminInputClass, "h-10 text-end tabular-nums")}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("common.amount")}
              </span>
              <Input
                value={
                  commission.rate !== null && commission.rate !== undefined
                    ? formatNumber(amounts[index] ?? 0, locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : (commission.amount ?? "")
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  update(index, {
                    amount: raw.trim() === "" ? null : Number(raw),
                  });
                }}
                inputMode="decimal"
                disabled={
                  disabled ||
                  (commission.rate !== null && commission.rate !== undefined)
                }
                className={cn(adminInputClass, "h-10 text-end tabular-nums")}
              />
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={t("common.delete")}
                className="mb-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {commission.kind === "DRIVER_REFERRAL"
              ? t("bookings.driverCommissionHint")
              : t("bookings.clientCommissionHint", { currency })}
          </p>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...value, emptyCommission()])}
      >
        <Plus />
        {t("bookings.addCommission")}
      </Button>
    </div>
  );
}
