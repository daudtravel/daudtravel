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
import { useSetRate } from "@/src/hooks/admin/useCurrency";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { todayDateOnly } from "@/src/utlis/admin/format";
import {
  BASE_CURRENCY,
  type LatestRate,
} from "@/src/types/admin/currency.types";

/** Manual rate for one currency and day; survives later automatic refreshes. */
export default function SetRateDialog({
  rate,
  onOpenChange,
}: {
  rate: LatestRate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const setRate = useSetRate();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rate) {
      setValue(rate.rate ? String(rate.rate) : "");
      setDate(todayDateOnly());
      setError(null);
    }
  }, [rate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate) return;
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t("currency.invalidRate"));
      return;
    }
    try {
      await setRate.mutateAsync({
        currency: rate.currency,
        date,
        rate: parsed,
      });
      toast.success(t("currency.rateSaved"));
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Dialog
      open={!!rate}
      onOpenChange={(open) => !setRate.isPending && onOpenChange(open)}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {t("currency.setManual")} — {rate?.currency}
            </DialogTitle>
            <DialogDescription>{t("currency.manualHint")}</DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="rate-date" className="text-sm font-semibold text-gray-700">
                {t("common.date")}
              </label>
              <Input
                id="rate-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rate-value" className="text-sm font-semibold text-gray-700">
                {t("currency.rateFor", {
                  currency: rate?.currency ?? "",
                  base: BASE_CURRENCY,
                })}
              </label>
              <Input
                id="rate-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className="h-11 rounded-xl tabular-nums"
                dir="ltr"
              />
              {error && (
                <p className="text-xs font-medium text-red-600">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setRate.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={setRate.isPending}>
              {setRate.isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
