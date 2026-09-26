"use client";

import { useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  SwitchField,
  TextField,
  TextareaField,
} from "@/src/components/admin/form/FormFields";
import { useSavePartner } from "@/src/hooks/admin/usePartners";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import {
  PARTNER_TYPES,
  type Partner,
  type PartnerType,
} from "@/src/types/admin/partners.types";

type FormValues = {
  name: string;
  type: PartnerType;
  phone: string;
  email: string;
  commissionRate: string;
  notes: string;
  isActive: boolean;
  createdById: string;
};

const EMPTY: FormValues = {
  name: "",
  type: "AGENT",
  phone: "",
  email: "",
  commissionRate: "0",
  notes: "",
  isActive: true,
  createdById: "",
};

export default function PartnerFormDialog({
  open,
  partner,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  partner: Partner | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const savePartner = useSavePartner();
  const { canAll } = usePermissions();
  const canReassign = canAll("PARTNERS", "edit");
  const owners = useUsersLookup(false, canReassign && open);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(120, t("form.tooLong", { max: 120 })),
        type: z.enum(PARTNER_TYPES),
        phone: z.string().trim().max(40, t("form.tooLong", { max: 40 })),
        email: z
          .string()
          .trim()
          .max(254, t("form.tooLong", { max: 254 }))
          .refine(
            (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            t("form.invalidEmail")
          ),
        commissionRate: z
          .string()
          .trim()
          .refine((value) => {
            if (!value) return true;
            const num = Number(value.replace(",", "."));
            return Number.isFinite(num) && num >= 0 && num <= 100;
          }, t("partners.rateRange")),
        notes: z.string().trim().max(2000, t("form.tooLong", { max: 2000 })),
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
    form.reset(
      partner
        ? {
            name: partner.name,
            type: partner.type,
            phone: partner.phone ?? "",
            email: partner.email ?? "",
            commissionRate: String(partner.commissionRate ?? 0),
            notes: partner.notes ?? "",
            isActive: partner.isActive,
            createdById: partner.createdById ?? "",
          }
        : EMPTY
    );
  }, [open, partner, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await savePartner.mutateAsync({
        id: partner?.id,
        payload: {
          name: values.name.trim(),
          type: values.type,
          phone: values.phone.trim() || null,
          email: values.email.trim() || null,
          commissionRate: Number(values.commissionRate.replace(",", ".")) || 0,
          notes: values.notes.trim() || null,
          isActive: values.isActive,
          ...(canReassign &&
            values.createdById && { createdById: values.createdById }),
        },
      });
      toast.success(
        partner ? t("partners.updated") : t("partners.created")
      );
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
      onOpenChange={(next) => !savePartner.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {partner ? t("partners.edit") : t("partners.new")}
          </DialogTitle>
          <DialogDescription>{t("partners.formHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField
              control={form.control}
              name="name"
              label={t("common.name")}
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                {t("common.type")}
              </label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as PartnerType, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`partners.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <TextField
              control={form.control}
              name="commissionRate"
              label={t("partners.commissionRate")}
              hint={t("partners.commissionHint")}
              inputMode="decimal"
              suffix="%"
            />

            <TextareaField
              control={form.control}
              name="notes"
              label={t("partners.notes")}
              rows={3}
            />

            <SwitchField
              control={form.control}
              name="isActive"
              label={t("partners.isActive")}
              hint={t("partners.isActiveHint")}
            />

            {canReassign && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  {t("common.owner")}
                </label>
                <Select
                  value={form.watch("createdById") || "__none__"}
                  onValueChange={(value) =>
                    form.setValue(
                      "createdById",
                      value === "__none__" ? "" : value,
                      { shouldDirty: true }
                    )
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">{t("common.me")}</SelectItem>
                    {(owners.data ?? []).map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {fullName(owner)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={savePartner.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={savePartner.isPending}>
                {savePartner.isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
