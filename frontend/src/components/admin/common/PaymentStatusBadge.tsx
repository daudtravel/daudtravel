"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/src/components/ui/badge";
import type { PaymentStatusValue } from "@/src/types/admin/orders.types";

const TONE: Record<
  PaymentStatusValue,
  "green" | "yellow" | "red" | "blue" | "neutral"
> = {
  PAID: "green",
  PENDING: "yellow",
  FAILED: "red",
  REFUNDED: "blue",
};

const LABEL_KEY: Record<PaymentStatusValue, string> = {
  PAID: "paid",
  PENDING: "pending",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export default function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatusValue;
}) {
  const t = useTranslations("admin.status");
  return (
    <Badge tone={TONE[status] ?? "neutral"}>
      {t.has(LABEL_KEY[status]) ? t(LABEL_KEY[status]) : status}
    </Badge>
  );
}

/** Options for the status filter dropdown. */
export function usePaymentStatusOptions() {
  const t = useTranslations("admin.status");
  return (Object.keys(LABEL_KEY) as PaymentStatusValue[]).map((status) => ({
    value: status,
    label: t(LABEL_KEY[status]),
  }));
}
