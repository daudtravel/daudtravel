"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import SelectField from "@/src/components/admin/form/SelectField";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useSaveTransaction } from "@/src/hooks/admin/useTransactions";
import { useVehicleOptions } from "@/src/hooks/admin/useVehicles";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useHotelOptions } from "@/src/hooks/admin/useHotels";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName, todayDateOnly } from "@/src/utlis/admin/format";
import {
  CURRENCIES,
  type CurrencyCode,
} from "@/src/types/admin/currency.types";
import {
  CATEGORIES_BY_TYPE,
  VEHICLE_CATEGORIES,
  type Transaction,
  type TransactionCategory,
  type TransactionPayload,
  type TransactionType,
} from "@/src/types/admin/transactions.types";
import { cn } from "@/src/utlis/cn";

interface FormState {
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  amount: string;
  currency: CurrencyCode;
  title: string;
  description: string;
  paymentMethod: string;
  vehicleId: string;
  driverId: string;
  hotelId: string;
  bookingId: string;
  employeeId: string;
  partnerId: string;
  createdById: string;
}

const EMPTY: FormState = {
  type: "EXPENSE",
  category: "OFFICE",
  date: todayDateOnly(),
  amount: "",
  currency: "GEL",
  title: "",
  description: "",
  paymentMethod: "",
  vehicleId: "",
  driverId: "",
  hotelId: "",
  bookingId: "",
  employeeId: "",
  partnerId: "",
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

export default function TransactionFormDialog({
  open,
  transaction,
  defaults,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  transaction: Transaction | null;
  /** Prefilled links when opened from a driver, vehicle, hotel or booking. */
  defaults?: Partial<FormState>;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveTransaction = useSaveTransaction();
  const { can, canAll } = usePermissions();

  const vehicles = useVehicleOptions(undefined, open && can("DRIVERS"));
  const drivers = useDriverOptions(open && can("DRIVERS"));
  const hotels = useHotelOptions(open && can("HOTELS"));
  const partners = usePartnerOptions(open && can("PARTNERS"));
  const employees = useUsersLookup(false, open);
  const owners = useUsersLookup(false, open && canAll("TRANSACTIONS", "edit"));

  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(
      transaction
        ? {
            type: transaction.type,
            category: transaction.category,
            date: transaction.date,
            amount: String(transaction.amount),
            currency: transaction.currency,
            title: transaction.title,
            description: transaction.description ?? "",
            paymentMethod: transaction.paymentMethod ?? "",
            vehicleId: transaction.vehicleId ?? "",
            driverId: transaction.driverId ?? "",
            hotelId: transaction.hotelId ?? "",
            bookingId: transaction.bookingId ?? "",
            employeeId: transaction.employeeId ?? "",
            partnerId: transaction.partnerId ?? "",
            createdById: transaction.createdById ?? "",
          }
        : { ...EMPTY, ...defaults }
    );
  }, [open, transaction, defaults]);

  const categories = useMemo(() => CATEGORIES_BY_TYPE[form.type], [form.type]);

  /** Switching side of the ledger keeps a valid category. */
  const onTypeChange = (next: TransactionType) => {
    const allowed = CATEGORIES_BY_TYPE[next];
    setForm((prev) => ({
      ...prev,
      type: next,
      category: allowed.includes(prev.category) ? prev.category : allowed[0],
    }));
  };

  const showVehicle = VEHICLE_CATEGORIES.includes(form.category);
  const showEmployee = form.category === "SALARY";

  const submit = async () => {
    const amount = Number(form.amount.replace(",", "."));
    if (!form.title.trim()) {
      toast.error(t("transactions.titleRequired"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t("transactions.amountRequired"));
      return;
    }

    const payload: TransactionPayload = {
      type: form.type,
      category: form.category,
      date: form.date,
      amount,
      currency: form.currency,
      title: form.title.trim(),
      description: form.description.trim() || null,
      paymentMethod: form.paymentMethod.trim() || null,
      vehicleId: form.vehicleId || null,
      driverId: form.driverId || null,
      hotelId: form.hotelId || null,
      bookingId: form.bookingId || null,
      employeeId: form.employeeId || null,
      partnerId: form.partnerId || null,
      ...(canAll("TRANSACTIONS", "edit") &&
        form.createdById && { createdById: form.createdById }),
    };

    try {
      await saveTransaction.mutateAsync({ id: transaction?.id, payload });
      toast.success(
        transaction ? t("transactions.updated") : t("transactions.created")
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveTransaction.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {transaction ? t("transactions.edit") : t("transactions.new")}
          </DialogTitle>
          <DialogDescription>{t("transactions.formHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label={t("common.type")}
              value={form.type}
              onChange={(value) => onTypeChange(value as TransactionType)}
              options={[
                { value: "EXPENSE", label: t("transactions.types.EXPENSE") },
                { value: "INCOME", label: t("transactions.types.INCOME") },
              ]}
              required
            />
            <SelectField
              label={t("common.category")}
              value={form.category}
              onChange={(value) =>
                set("category", value as TransactionCategory)
              }
              options={categories.map((category) => ({
                value: category,
                label: t(`transactions.categories.${category}`),
              }))}
              required
            />
            <Field label={t("common.date")}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={adminInputClass}
              />
            </Field>
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <Field label={t("common.amount")}>
                <Input
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  inputMode="decimal"
                  className={cn(adminInputClass, "text-end tabular-nums")}
                />
              </Field>
              <SelectField
                label={t("hotels.currency")}
                value={form.currency}
                onChange={(value) => set("currency", value as CurrencyCode)}
                options={CURRENCIES.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
              />
            </div>
          </div>

          <Field label={t("transactions.title")}>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={200}
              className={adminInputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {(showVehicle || form.vehicleId) && can("DRIVERS") && (
              <SelectField
                label={t("vehicles.vehicle")}
                value={form.vehicleId}
                onChange={(value) => set("vehicleId", value)}
                emptyLabel={t("bookings.noVehicle")}
                options={(vehicles.data ?? []).map((vehicle) => ({
                  value: vehicle.id,
                  label: `${vehicle.brand} ${vehicle.model}${
                    vehicle.year ? ` · ${vehicle.year}` : ""
                  }`,
                }))}
              />
            )}
            {showEmployee && (
              <SelectField
                label={t("transactions.employee")}
                value={form.employeeId}
                onChange={(value) => set("employeeId", value)}
                emptyLabel={t("transactions.noEmployee")}
                options={(employees.data ?? []).map((employee) => ({
                  value: employee.id,
                  label: fullName(employee),
                }))}
              />
            )}
            {can("DRIVERS") && (
              <SelectField
                label={t("vehicles.driver")}
                value={form.driverId}
                onChange={(value) => set("driverId", value)}
                emptyLabel={t("vehicles.noDriver")}
                options={(drivers.data ?? []).map((driver) => ({
                  value: driver.id,
                  label: fullName(driver),
                }))}
              />
            )}
            {can("HOTELS") && (
              <SelectField
                label={t("nav.hotels")}
                value={form.hotelId}
                onChange={(value) => set("hotelId", value)}
                emptyLabel={t("bookings.noHotel")}
                options={(hotels.data ?? []).map((hotel) => ({
                  value: hotel.id,
                  label: `${hotel.name} · ${hotel.city}`,
                }))}
              />
            )}
            {can("PARTNERS") && (
              <SelectField
                label={t("nav.partners")}
                value={form.partnerId}
                onChange={(value) => set("partnerId", value)}
                emptyLabel={t("bookings.noPartner")}
                options={(partners.data ?? []).map((partner) => ({
                  value: partner.id,
                  label: partner.name,
                }))}
              />
            )}
            <Field label={t("bookings.paymentMethod")}>
              <Input
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
                maxLength={60}
                className={adminInputClass}
              />
            </Field>
            {canAll("TRANSACTIONS", "edit") && (
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

          <Field label={t("common.notes")}>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={2000}
              className="rounded-xl border-gray-200"
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveTransaction.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saveTransaction.isPending}
          >
            {saveTransaction.isPending && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
