"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Form } from "@/src/components/ui/form";
import {
  SwitchField,
  TextField,
  TextareaField,
} from "@/src/components/admin/form/FormFields";
import SelectField from "@/src/components/admin/form/SelectField";
import TagsInput from "@/src/components/admin/form/TagsInput";
import PhotoField from "@/src/components/admin/form/PhotoField";
import {
  useDriverLanguages,
  useSaveDriver,
} from "@/src/hooks/admin/useDrivers";
import { usePartnerOptions } from "@/src/hooks/admin/usePartners";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import type { AdminDriver } from "@/src/types/admin/drivers.types";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dailyRentPrice: string;
  referrerId: string;
  referrerCommissionRate: string;
  notes: string;
  isActive: boolean;
  showOnWebsite: boolean;
  createdById: string;
};

const EMPTY: FormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dailyRentPrice: "",
  referrerId: "",
  referrerCommissionRate: "",
  notes: "",
  isActive: true,
  showOnWebsite: true,
  createdById: "",
};

export default function DriverFormDialog({
  open,
  driver,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  driver: AdminDriver | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveDriver = useSaveDriver();
  const { can, canAll } = usePermissions();
  const canPublish = can("WEBSITE", "edit");
  const canReassign = canAll("DRIVERS", "edit");
  const owners = useUsersLookup(false, canReassign && open);
  const partners = usePartnerOptions(open);
  const knownLanguages = useDriverLanguages(open);

  const [languages, setLanguages] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(100, t("form.tooLong", { max: 100 })),
        lastName: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(100, t("form.tooLong", { max: 100 })),
        phone: z
          .string()
          .trim()
          .max(40, t("form.tooLong", { max: 40 })),
        email: z
          .string()
          .trim()
          .max(254, t("form.tooLong", { max: 254 }))
          .refine(
            (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            t("form.invalidEmail")
          ),
        dailyRentPrice: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0 && num <= 100000;
        }, t("drivers.priceRange")),
        referrerId: z.string(),
        referrerCommissionRate: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0 && num <= 100;
        }, t("partners.rateRange")),
        notes: z
          .string()
          .trim()
          .max(2000, t("form.tooLong", { max: 2000 })),
        isActive: z.boolean(),
        showOnWebsite: z.boolean(),
        createdById: z.string(),
      }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setPhotoRemoved(false);
    setLanguages(driver?.languages ?? []);
    form.reset(
      driver
        ? {
            firstName: driver.firstName,
            lastName: driver.lastName,
            phone: driver.phone ?? "",
            email: driver.email ?? "",
            dailyRentPrice:
              driver.dailyRentPrice !== null
                ? String(driver.dailyRentPrice)
                : "",
            referrerId: driver.referrerId ?? "",
            referrerCommissionRate:
              driver.referrerCommissionRate !== null
                ? String(driver.referrerCommissionRate)
                : "",
            notes: driver.notes ?? "",
            isActive: driver.isActive,
            showOnWebsite: driver.showOnWebsite,
            createdById: driver.createdById ?? "",
          }
        : { ...EMPTY, showOnWebsite: canPublish }
    );
  }, [open, driver, form, canPublish]);

  const referrerId = form.watch("referrerId");

  /** Picking a referrer suggests their standard percentage. */
  const onReferrerChange = (value: string) => {
    form.setValue("referrerId", value, { shouldDirty: true });
    const partner = partners.data?.find((p) => p.id === value);
    if (partner && !form.getValues("referrerCommissionRate").trim()) {
      form.setValue("referrerCommissionRate", String(partner.commissionRate), {
        shouldDirty: true,
      });
    }
    if (!value)
      form.setValue("referrerCommissionRate", "", { shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await saveDriver.mutateAsync({
        id: driver?.id,
        payload: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          languages,
          dailyRentPrice: values.dailyRentPrice.trim()
            ? Number(values.dailyRentPrice.replace(",", "."))
            : null,
          phone: values.phone.trim() || null,
          email: values.email.trim() || null,
          notes: values.notes.trim() || null,
          isActive: values.isActive,
          referrerId: values.referrerId || null,
          referrerCommissionRate: values.referrerId
            ? values.referrerCommissionRate.trim()
              ? Number(values.referrerCommissionRate.replace(",", "."))
              : null
            : null,
          // Only someone who maintains the website may change this
          ...(canPublish && { showOnWebsite: values.showOnWebsite }),
          ...(canReassign &&
            values.createdById && { createdById: values.createdById }),
          ...(driver && photoRemoved && !photo && { removePhoto: true }),
        },
        photo,
      });
      toast.success(driver ? t("drivers.updated") : t("drivers.created"));
      onOpenChange(false);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      if (getApiStatus(error) === 400) form.setError("firstName", { message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveDriver.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {driver ? t("drivers.edit") : t("drivers.new")}
          </DialogTitle>
          <DialogDescription>{t("drivers.formHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <PhotoField
              label={t("drivers.photo")}
              hint={t("drivers.photoHint")}
              currentUrl={driver?.photo}
              file={photo}
              onFileChange={setPhoto}
              removed={photoRemoved}
              onRemovedChange={setPhotoRemoved}
              disabled={saveDriver.isPending}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="firstName"
                label={t("drivers.firstName")}
                required
              />
              <TextField
                control={form.control}
                name="lastName"
                label={t("drivers.lastName")}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="phone"
                label={t("users.phone")}
                type="tel"
                dir="ltr"
              />
              <TextField
                control={form.control}
                name="email"
                label={t("users.email")}
                type="email"
                dir="ltr"
              />
            </div>

            <TagsInput
              label={t("drivers.languages")}
              hint={t("drivers.languagesHint")}
              value={languages}
              onChange={setLanguages}
              suggestions={knownLanguages.data ?? []}
              disabled={saveDriver.isPending}
            />

            <TextField
              control={form.control}
              name="dailyRentPrice"
              label={t("drivers.dailyRentPrice")}
              hint={t("drivers.dailyRentHint")}
              inputMode="decimal"
              suffix="GEL"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t("drivers.referrer")}
                hint={t("drivers.referrerHint")}
                value={referrerId}
                onChange={onReferrerChange}
                emptyLabel={t("drivers.noReferrer")}
                options={(partners.data ?? []).map((partner) => ({
                  value: partner.id,
                  label: partner.name,
                }))}
              />
              <TextField
                control={form.control}
                name="referrerCommissionRate"
                label={t("drivers.referrerRate")}
                inputMode="decimal"
                suffix="%"
                disabled={!referrerId}
              />
            </div>

            <TextareaField
              control={form.control}
              name="notes"
              label={t("common.notes")}
              rows={3}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchField
                control={form.control}
                name="isActive"
                label={t("drivers.isActive")}
                hint={t("drivers.isActiveHint")}
              />
              {canPublish && (
                <SwitchField
                  control={form.control}
                  name="showOnWebsite"
                  label={t("drivers.showOnWebsite")}
                  hint={t("drivers.showOnWebsiteHint")}
                />
              )}
            </div>

            {canReassign && (
              <SelectField
                label={t("common.owner")}
                value={form.watch("createdById")}
                onChange={(value) =>
                  form.setValue("createdById", value, { shouldDirty: true })
                }
                emptyLabel={t("common.me")}
                options={(owners.data ?? []).map((owner) => ({
                  value: owner.id,
                  label: fullName(owner),
                }))}
              />
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveDriver.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saveDriver.isPending}>
                {saveDriver.isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
