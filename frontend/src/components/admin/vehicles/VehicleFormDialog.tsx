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
  SwitchField,
  TextField,
  TextareaField,
} from "@/src/components/admin/form/FormFields";
import SelectField from "@/src/components/admin/form/SelectField";
import { useSaveVehicle } from "@/src/hooks/admin/useVehicles";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import {
  VEHICLE_OWNERSHIPS,
  VEHICLE_TYPES,
  type Vehicle,
  type VehicleOwnership,
  type VehicleType,
} from "@/src/types/admin/drivers.types";

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear() + 2;

type FormValues = {
  type: VehicleType;
  brand: string;
  model: string;
  year: string;
  seats: string;
  plateNumber: string;
  color: string;
  ownership: VehicleOwnership;
  driverId: string;
  isActive: boolean;
  notes: string;
  createdById: string;
};

const EMPTY: FormValues = {
  type: "SEDAN",
  brand: "",
  model: "",
  year: "",
  seats: "4",
  plateNumber: "",
  color: "",
  ownership: "DRIVER",
  driverId: "",
  isActive: true,
  notes: "",
  createdById: "",
};

export default function VehicleFormDialog({
  open,
  vehicle,
  onOpenChange,
  presetDriverId,
  lockDriver = false,
}: {
  open: boolean;
  /** null = create */
  vehicle: Vehicle | null;
  onOpenChange: (open: boolean) => void;
  presetDriverId?: string;
  /** Opened from a driver page: the driver can't be changed here. */
  lockDriver?: boolean;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveVehicle = useSaveVehicle();
  const { canAll } = usePermissions();
  const canReassign = canAll("DRIVERS", "edit");
  const owners = useUsersLookup(false, canReassign && open);
  const drivers = useDriverOptions(open && !lockDriver);

  const schema = useMemo(
    () =>
      z.object({
        type: z.enum(VEHICLE_TYPES),
        brand: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(80, t("form.tooLong", { max: 80 })),
        model: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(80, t("form.tooLong", { max: 80 })),
        year: z.string().refine(
          (value) => {
            if (!value.trim()) return true;
            const num = Number(value);
            return Number.isInteger(num) && num >= MIN_YEAR && num <= MAX_YEAR;
          },
          t("vehicles.yearRange", {
            min: String(MIN_YEAR),
            max: String(MAX_YEAR),
          })
        ),
        seats: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value);
          return Number.isInteger(num) && num >= 1 && num <= 100;
        }, t("vehicles.seatsRange")),
        plateNumber: z
          .string()
          .trim()
          .max(20, t("form.tooLong", { max: 20 })),
        color: z
          .string()
          .trim()
          .max(40, t("form.tooLong", { max: 40 })),
        ownership: z.enum(VEHICLE_OWNERSHIPS),
        driverId: z.string(),
        isActive: z.boolean(),
        notes: z
          .string()
          .trim()
          .max(2000, t("form.tooLong", { max: 2000 })),
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
      vehicle
        ? {
            type: vehicle.type,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year !== null ? String(vehicle.year) : "",
            seats: String(vehicle.seats),
            plateNumber: vehicle.plateNumber ?? "",
            color: vehicle.color ?? "",
            ownership: vehicle.ownership,
            driverId: vehicle.driverId ?? "",
            isActive: vehicle.isActive,
            notes: vehicle.notes ?? "",
            createdById: vehicle.createdById ?? "",
          }
        : { ...EMPTY, driverId: presetDriverId ?? "" }
    );
  }, [open, vehicle, presetDriverId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveVehicle.mutateAsync({
        id: vehicle?.id,
        payload: {
          type: values.type,
          brand: values.brand.trim(),
          model: values.model.trim(),
          year: values.year.trim() ? Number(values.year) : null,
          seats: values.seats.trim() ? Number(values.seats) : 4,
          plateNumber: values.plateNumber.trim() || null,
          color: values.color.trim() || null,
          ownership: values.ownership,
          driverId: lockDriver
            ? (presetDriverId ?? null)
            : values.driverId || null,
          isActive: values.isActive,
          notes: values.notes.trim() || null,
          ...(canReassign &&
            values.createdById && { createdById: values.createdById }),
        },
      });
      toast.success(vehicle ? t("vehicles.updated") : t("vehicles.created"));
      onOpenChange(false);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      if (getApiStatus(error) === 400) form.setError("brand", { message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveVehicle.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? t("vehicles.edit") : t("vehicles.new")}
          </DialogTitle>
          <DialogDescription>{t("vehicles.formHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t("vehicles.type")}
                value={form.watch("type")}
                onChange={(value) =>
                  form.setValue("type", value as VehicleType, {
                    shouldDirty: true,
                  })
                }
                options={VEHICLE_TYPES.map((type) => ({
                  value: type,
                  label: t(`vehicles.${type}`),
                }))}
                required
              />
              <SelectField
                label={t("vehicles.ownership")}
                value={form.watch("ownership")}
                onChange={(value) =>
                  form.setValue("ownership", value as VehicleOwnership, {
                    shouldDirty: true,
                  })
                }
                options={VEHICLE_OWNERSHIPS.map((value) => ({
                  value,
                  label: t(`vehicles.ownerships.${value}`),
                }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="brand"
                label={t("vehicles.brand")}
                placeholder="Mercedes"
                required
              />
              <TextField
                control={form.control}
                name="model"
                label={t("vehicles.model")}
                placeholder="Vito"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                control={form.control}
                name="year"
                label={t("vehicles.year")}
                inputMode="numeric"
                placeholder="2019"
              />
              <TextField
                control={form.control}
                name="seats"
                label={t("vehicles.seats")}
                inputMode="numeric"
              />
              <TextField
                control={form.control}
                name="color"
                label={t("vehicles.color")}
              />
            </div>

            <TextField
              control={form.control}
              name="plateNumber"
              label={t("vehicles.plateNumber")}
              dir="ltr"
              placeholder="AA-123-BB"
            />

            {!lockDriver && (
              <SelectField
                label={t("vehicles.driver")}
                hint={t("vehicles.driverHint")}
                value={form.watch("driverId")}
                onChange={(value) =>
                  form.setValue("driverId", value, { shouldDirty: true })
                }
                emptyLabel={t("vehicles.noDriver")}
                options={(drivers.data ?? []).map((driver) => ({
                  value: driver.id,
                  label: fullName(driver),
                }))}
              />
            )}

            <TextareaField
              control={form.control}
              name="notes"
              label={t("common.notes")}
              rows={3}
            />

            <SwitchField
              control={form.control}
              name="isActive"
              label={t("vehicles.isActive")}
              hint={t("vehicles.isActiveHint")}
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
                disabled={saveVehicle.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saveVehicle.isPending}>
                {saveVehicle.isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
