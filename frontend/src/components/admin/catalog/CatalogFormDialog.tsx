"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/src/components/ui/switch";
import SelectField from "@/src/components/admin/form/SelectField";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useSaveCatalogItem } from "@/src/hooks/admin/useCatalog";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import {
  CURRENCIES,
  type CurrencyCode,
} from "@/src/types/admin/currency.types";
import {
  VEHICLE_TYPES,
  type VehicleType,
} from "@/src/types/admin/drivers.types";
import {
  CATALOG_CATEGORIES,
  CATALOG_SEASONS,
  CATALOG_UNITS,
  type CatalogCategory,
  type CatalogItem,
  type CatalogSeason,
  type CatalogUnit,
} from "@/src/types/admin/catalog.types";
import { cn } from "@/src/utlis/cn";

interface FormState {
  name: string;
  category: CatalogCategory;
  description: string;
  unit: CatalogUnit;
  price: string;
  cost: string;
  currency: CurrencyCode;
  vehicleType: string;
  city: string;
  season: CatalogSeason;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  sortOrder: string;
  createdById: string;
}

const EMPTY: FormState = {
  name: "",
  category: "TOUR",
  description: "",
  unit: "PER_PERSON",
  price: "",
  cost: "",
  currency: "GEL",
  vehicleType: "",
  city: "",
  season: "ALL_YEAR",
  validFrom: "",
  validTo: "",
  isActive: true,
  sortOrder: "0",
  createdById: "",
};

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export default function CatalogFormDialog({
  open,
  item,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  item: CatalogItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveItem = useSaveCatalogItem();
  const { canAll } = usePermissions();
  const canReassign = canAll("CATALOG", "edit");
  const owners = useUsersLookup(false, canReassign && open);

  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            name: item.name,
            category: item.category,
            description: item.description ?? "",
            unit: item.unit,
            price: String(item.price),
            cost: item.cost !== null ? String(item.cost) : "",
            currency: item.currency,
            vehicleType: item.vehicleType ?? "",
            city: item.city ?? "",
            season: item.season,
            validFrom: item.validFrom ?? "",
            validTo: item.validTo ?? "",
            isActive: item.isActive,
            sortOrder: String(item.sortOrder),
            createdById: item.createdById ?? "",
          }
        : EMPTY
    );
  }, [open, item]);

  const submit = async () => {
    const price = Number(form.price.replace(",", "."));
    if (!form.name.trim()) {
      toast.error(t("catalog.nameRequired"));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error(t("catalog.priceRequired"));
      return;
    }

    try {
      await saveItem.mutateAsync({
        id: item?.id,
        payload: {
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim() || null,
          unit: form.unit,
          price,
          cost: form.cost.trim() ? Number(form.cost.replace(",", ".")) : null,
          currency: form.currency,
          vehicleType: (form.vehicleType || null) as VehicleType | null,
          city: form.city.trim() || null,
          season: form.season,
          validFrom: form.validFrom || null,
          validTo: form.validTo || null,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
          ...(canReassign &&
            form.createdById && { createdById: form.createdById }),
        },
      });
      toast.success(item ? t("catalog.updated") : t("catalog.created"));
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveItem.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? t("catalog.edit") : t("catalog.new")}
          </DialogTitle>
          <DialogDescription>{t("catalog.formHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label={t("catalog.name")}>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={200}
              className={adminInputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label={t("common.category")}
              value={form.category}
              onChange={(value) => set("category", value as CatalogCategory)}
              options={CATALOG_CATEGORIES.map((category) => ({
                value: category,
                label: t(`catalog.categories.${category}`),
              }))}
            />
            <SelectField
              label={t("catalog.unit")}
              value={form.unit}
              onChange={(value) => set("unit", value as CatalogUnit)}
              options={CATALOG_UNITS.map((unit) => ({
                value: unit,
                label: t(`catalog.units.${unit}`),
              }))}
            />
            <SelectField
              label={t("catalog.season")}
              value={form.season}
              onChange={(value) => set("season", value as CatalogSeason)}
              options={CATALOG_SEASONS.map((season) => ({
                value: season,
                label: t(`catalog.seasons.${season}`),
              }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("catalog.price")}>
              <Input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                inputMode="decimal"
                className={cn(adminInputClass, "text-end tabular-nums")}
              />
            </Field>
            <Field label={t("catalog.cost")} hint={t("catalog.costHint")}>
              <Input
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label={t("vehicles.type")}
              value={form.vehicleType}
              onChange={(value) => set("vehicleType", value)}
              emptyLabel={t("catalog.anyVehicle")}
              options={VEHICLE_TYPES.map((type) => ({
                value: type,
                label: t(`vehicles.${type}`),
              }))}
            />
            <Field label={t("hotels.city")}>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                maxLength={120}
                className={adminInputClass}
              />
            </Field>
            <Field label={t("catalog.validFrom")}>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                className={adminInputClass}
              />
            </Field>
            <Field label={t("catalog.validTo")}>
              <Input
                type="date"
                value={form.validTo}
                onChange={(e) => set("validTo", e.target.value)}
                className={adminInputClass}
              />
            </Field>
          </div>

          <Field label={t("common.description")}>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={2000}
              className="rounded-xl border-gray-200"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("catalog.sortOrder")} hint={t("catalog.sortHint")}>
              <Input
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                inputMode="numeric"
                className={adminInputClass}
              />
            </Field>
            {canReassign && (
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

          <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {t("catalog.isActive")}
              </p>
              <p className="text-xs text-gray-500">
                {t("catalog.isActiveHint")}
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => set("isActive", checked)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveItem.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saveItem.isPending}
          >
            {saveItem.isPending && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
