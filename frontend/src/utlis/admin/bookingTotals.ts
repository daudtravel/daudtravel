import type {
  BookingCommissionPayload,
  BookingItemPayload,
} from "@/src/types/admin/bookings.types";

/** Rounds half-up to 2 decimals, like the server does. */
export function round2(value: number): number {
  const scaled = value * 100;
  const rounded =
    scaled >= 0 ? Math.round(scaled) : -Math.round(Math.abs(scaled));
  return rounded / 100;
}

export interface BookingTotals {
  totalPrice: number;
  totalCost: number;
  commissionAmounts: number[];
  totalCommission: number;
  /** price − cost − commissions */
  profit: number;
}

/**
 * The same arithmetic as the API, so the form can show live totals. The server
 * recomputes everything on save — this is only a preview.
 */
export function computeBookingTotals(
  items: BookingItemPayload[],
  commissions: BookingCommissionPayload[]
): BookingTotals {
  let totalPrice = 0;
  let totalCost = 0;
  const driverCost = new Map<string, number>();

  for (const item of items) {
    const sale = round2(Number(item.salePrice ?? 0) || 0);
    const cost = round2(Number(item.costPrice ?? 0) || 0);
    totalPrice = round2(totalPrice + sale);
    totalCost = round2(totalCost + cost);
    if (item.driverId) {
      driverCost.set(
        item.driverId,
        round2((driverCost.get(item.driverId) ?? 0) + cost)
      );
    }
  }

  const commissionAmounts = commissions.map((commission) => {
    if (commission.rate === null || commission.rate === undefined) {
      return round2(Number(commission.amount ?? 0) || 0);
    }
    const base =
      commission.kind === "DRIVER_REFERRAL" && commission.driverId
        ? (driverCost.get(commission.driverId) ?? 0)
        : totalPrice;
    return round2((base * (Number(commission.rate) || 0)) / 100);
  });

  const totalCommission = round2(
    commissionAmounts.reduce((sum, amount) => sum + amount, 0)
  );

  return {
    totalPrice,
    totalCost,
    commissionAmounts,
    totalCommission,
    profit: round2(totalPrice - totalCost - totalCommission),
  };
}
