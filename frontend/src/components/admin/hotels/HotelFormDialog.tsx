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
import { useSaveHotel } from "@/src/hooks/admin/useHotels";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import {
  HOTEL_CATEGORIES,
  type Hotel,
  type HotelCategory,
  type HotelContactPayload,
} from "@/src/types/admin/hotels.types";
import ContactsField, { emptyContact } from "./ContactsField";

type FormValues = {
  name: string;
  city: string;
  region: string;
  address: string;
  stars: string;
  category: HotelCategory;
  priceFrom: string;
  priceCurrency: string;
  website: string;
  commissionRate: string;
  notes: string;
  isActive: boolean;
  createdById: string;
};

const EMPTY: FormValues = {
  name: "",
  city: "",
  region: "",
  address: "",
  stars: "",
  category: "STANDARD",
  priceFrom: "",
  priceCurrency: "GEL",
  website: "",
  commissionRate: "",
  notes: "",
  isActive: true,
  createdById: "",
};

export default function HotelFormDialog({
  open,
  hotel,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  hotel: Hotel | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveHotel = useSaveHotel();
  const { canAll } = usePermissions();
  const canReassign = canAll("HOTELS", "edit");
  const owners = useUsersLookup(false, canReassign && open);

  const [contacts, setContacts] = useState<HotelContactPayload[]>([]);
  const [contactError, setContactError] = useState<number | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(160, t("form.tooLong", { max: 160 })),
        city: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(120, t("form.tooLong", { max: 120 })),
        region: z
          .string()
          .trim()
          .max(120, t("form.tooLong", { max: 120 })),
        address: z
          .string()
          .trim()
          .max(300, t("form.tooLong", { max: 300 })),
        stars: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value);
          return Number.isInteger(num) && num >= 1 && num <= 5;
        }, t("hotels.starsRange")),
        category: z.enum(HOTEL_CATEGORIES),
        priceFrom: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0;
        }, t("hotels.priceInvalid")),
        priceCurrency: z.string(),
        website: z
          .string()
          .trim()
          .max(300, t("form.tooLong", { max: 300 })),
        commissionRate: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0 && num <= 100;
        }, t("partners.rateRange")),
        notes: z
          .string()
          .trim()
          .max(2000, t("form.tooLong", { max: 2000 })),
        isActive: z.boolean(),
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
    setContactError(null);
    setContacts(
      hotel
        ? hotel.contacts.map((contact) => ({
            type: contact.type,
            name: contact.name ?? "",
            phone: contact.phone ?? "",
            email: contact.email ?? "",
            note: contact.note ?? "",
          }))
        : [emptyContact()]
    );
    form.reset(
      hotel
        ? {
            name: hotel.name,
            city: hotel.city,
            region: hotel.region ?? "",
            address: hotel.address ?? "",
            stars: hotel.stars !== null ? String(hotel.stars) : "",
            category: hotel.category,
            priceFrom: hotel.priceFrom !== null ? String(hotel.priceFrom) : "",
            priceCurrency: hotel.priceCurrency ?? "GEL",
            website: hotel.website ?? "",
            commissionRate:
              hotel.commissionRate !== null ? String(hotel.commissionRate) : "",
            notes: hotel.notes ?? "",
            isActive: hotel.isActive,
            createdById: hotel.createdById ?? "",
          }
        : EMPTY
    );
  }, [open, hotel, form]);

  const onSubmit = async (values: FormValues) => {
    // Drop rows the user added but never filled in
    const filled = contacts.filter(
      (contact) =>
        contact.name?.trim() ||
        contact.phone?.trim() ||
        contact.email?.trim() ||
        contact.note?.trim()
    );
    const invalid = filled.findIndex(
      (contact) => !contact.phone?.trim() && !contact.email?.trim()
    );
    if (invalid >= 0) {
      setContactError(invalid);
      toast.error(t("hotels.contactNeedsPhoneOrEmail"));
      return;
    }
    setContactError(null);

    try {
      await saveHotel.mutateAsync({
        id: hotel?.id,
        payload: {
          name: values.name.trim(),
          city: values.city.trim(),
          region: values.region.trim() || null,
          address: values.address.trim() || null,
          stars: values.stars.trim() ? Number(values.stars) : null,
          category: values.category,
          priceFrom: values.priceFrom.trim()
            ? Number(values.priceFrom.replace(",", "."))
            : null,
          priceCurrency: values.priceFrom.trim() ? values.priceCurrency : null,
          website: values.website.trim() || null,
          commissionRate: values.commissionRate.trim()
            ? Number(values.commissionRate.replace(",", "."))
            : null,
          notes: values.notes.trim() || null,
          isActive: values.isActive,
          contacts: filled.map((contact, index) => ({
            type: contact.type,
            name: contact.name?.trim() || null,
            phone: contact.phone?.trim() || null,
            email: contact.email?.trim() || null,
            note: contact.note?.trim() || null,
            sortOrder: index,
          })),
          ...(canReassign &&
            values.createdById && { createdById: values.createdById }),
        },
      });
      toast.success(hotel ? t("hotels.updated") : t("hotels.created"));
      onOpenChange(false);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      if (getApiStatus(error) === 400) form.setError("name", { message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveHotel.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {hotel ? t("hotels.edit") : t("hotels.new")}
          </DialogTitle>
          <DialogDescription>{t("hotels.formHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <TextField
              control={form.control}
              name="name"
              label={t("hotels.name")}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="city"
                label={t("hotels.city")}
                required
              />
              <TextField
                control={form.control}
                name="region"
                label={t("hotels.region")}
                hint={t("hotels.regionHint")}
              />
            </div>

            <TextField
              control={form.control}
              name="address"
              label={t("hotels.address")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t("hotels.category")}
                value={form.watch("category")}
                onChange={(value) =>
                  form.setValue("category", value as HotelCategory, {
                    shouldDirty: true,
                  })
                }
                options={HOTEL_CATEGORIES.map((category) => ({
                  value: category,
                  label: t(`hotels.categories.${category}`),
                }))}
              />
              <TextField
                control={form.control}
                name="stars"
                label={t("hotels.stars")}
                inputMode="numeric"
                placeholder="4"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                control={form.control}
                name="priceFrom"
                label={t("hotels.priceFrom")}
                hint={t("hotels.priceHint")}
                inputMode="decimal"
                className="sm:col-span-2"
              />
              <SelectField
                label={t("hotels.currency")}
                value={form.watch("priceCurrency")}
                onChange={(value) =>
                  form.setValue("priceCurrency", value, { shouldDirty: true })
                }
                options={CURRENCIES.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="commissionRate"
                label={t("hotels.commissionRate")}
                hint={t("hotels.commissionHint")}
                inputMode="decimal"
                suffix="%"
              />
              <TextField
                control={form.control}
                name="website"
                label={t("hotels.website")}
                dir="ltr"
                placeholder="https://"
              />
            </div>

            <ContactsField
              value={contacts}
              onChange={(next) => {
                setContacts(next);
                setContactError(null);
              }}
              disabled={saveHotel.isPending}
              error={contactError}
            />

            <TextareaField
              control={form.control}
              name="notes"
              label={t("common.notes")}
              rows={3}
            />

            <SwitchField
              control={form.control}
              name="isActive"
              label={t("hotels.isActive")}
              hint={t("hotels.isActiveHint")}
            />

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
                disabled={saveHotel.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saveHotel.isPending}>
                {saveHotel.isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
