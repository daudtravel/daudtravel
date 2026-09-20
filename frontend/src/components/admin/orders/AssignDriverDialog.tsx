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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  useAssignTransferDriver,
  useDriverOptions,
} from "@/src/hooks/admin/useAdminLists";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import type { TransferOrderRow } from "@/src/types/admin/orders.types";

const NONE = "__none__";

/** Lets an admin set or clear the driver of a website transfer order. */
export default function AssignDriverDialog({
  order,
  onOpenChange,
}: {
  order: TransferOrderRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const drivers = useDriverOptions(!!order);
  const assign = useAssignTransferDriver();
  const [value, setValue] = useState<string>(NONE);

  useEffect(() => {
    setValue(order?.driver?.id ?? NONE);
  }, [order]);

  const submit = async () => {
    if (!order) return;
    try {
      await assign.mutateAsync({
        orderId: order.id,
        driverId: value === NONE ? null : value,
      });
      toast.success(t("transferOrders.driverAssigned"));
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => !assign.isPending && onOpenChange(open)}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("transferOrders.assignDriver")}</DialogTitle>
          <DialogDescription>
            {order?.route} — {order?.customer.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            {t("transferOrders.driver")}
          </label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={NONE}>
                {t("transferOrders.noDriver")}
              </SelectItem>
              {(drivers.data ?? []).map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {fullName(driver)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {drivers.isLoading && (
            <p className="text-xs text-gray-500">{t("common.loading")}</p>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assign.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={assign.isPending}>
            {assign.isPending && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
