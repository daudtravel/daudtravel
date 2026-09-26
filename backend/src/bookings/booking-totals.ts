import { CommissionKind, Prisma } from '@prisma/client';

export type DecimalLike = Prisma.Decimal | number | string;

/** Money is rounded half-up to 2 decimals, always on the server. */
export function money(value: DecimalLike): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

export interface TotalsItem {
  driverId?: string | null;
  salePrice: DecimalLike;
  costPrice: DecimalLike;
}

export interface TotalsCommission {
  kind: CommissionKind;
  driverId?: string | null;
  /** Percent; when set, the amount is computed from the base. */
  rate?: DecimalLike | null;
  amount?: DecimalLike | null;
}

export interface BookingTotals {
  totalPrice: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  /** Amount per commission, in the order they were given. */
  commissionAmounts: Prisma.Decimal[];
  totalCommission: Prisma.Decimal;
  /** What the company keeps: price − cost − commissions. */
  profit: Prisma.Decimal;
}

/**
 * Booking totals.
 *
 * A percentage commission for whoever brought the client is taken from the
 * booking total; one for whoever brought a driver is taken from that driver's
 * earnings (the cost of the lines they work), which is what is actually paid
 * out. A commission without a rate keeps the fixed amount entered by hand.
 */
export function computeTotals(
  items: TotalsItem[],
  commissions: TotalsCommission[],
): BookingTotals {
  let totalPrice = new Prisma.Decimal(0);
  let totalCost = new Prisma.Decimal(0);
  const driverCost = new Map<string, Prisma.Decimal>();

  for (const item of items) {
    const sale = money(item.salePrice ?? 0);
    const cost = money(item.costPrice ?? 0);
    totalPrice = totalPrice.add(sale);
    totalCost = totalCost.add(cost);
    if (item.driverId) {
      driverCost.set(
        item.driverId,
        (driverCost.get(item.driverId) ?? new Prisma.Decimal(0)).add(cost),
      );
    }
  }

  const commissionAmounts = commissions.map((commission) => {
    if (commission.rate === null || commission.rate === undefined) {
      return money(commission.amount ?? 0);
    }
    const base =
      commission.kind === CommissionKind.DRIVER_REFERRAL && commission.driverId
        ? (driverCost.get(commission.driverId) ?? new Prisma.Decimal(0))
        : totalPrice;
    return money(base.mul(new Prisma.Decimal(commission.rate)).div(100));
  });

  const totalCommission = commissionAmounts.reduce(
    (sum, amount) => sum.add(amount),
    new Prisma.Decimal(0),
  );

  return {
    totalPrice: money(totalPrice),
    totalCost: money(totalCost),
    commissionAmounts,
    totalCommission: money(totalCommission),
    profit: money(totalPrice.sub(totalCost).sub(totalCommission)),
  };
}
