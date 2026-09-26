export const CURRENCIES = [
  "GEL",
  "USD",
  "EUR",
  "TRY",
  "RUB",
  "AED",
  "SAR",
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/** GEL is the base: stored rates say how many GEL one unit costs. */
export const BASE_CURRENCY: CurrencyCode = "GEL";

export type RateSource = "NBG" | "EXCHANGERATE_API" | "MANUAL";

export interface LatestRate {
  currency: CurrencyCode;
  rate: number;
  date: string | null;
  source: RateSource | null;
  stale?: boolean;
}

export interface RateRow {
  id: string;
  currency: CurrencyCode;
  date: string;
  rate: number;
  source: RateSource;
  fetchedAt: string;
}

export interface RefreshResult {
  saved: number;
  sources: string[];
  missing: CurrencyCode[];
}

/**
 * Converts through the base currency using "GEL per unit" rates.
 * Returns null when a rate is missing, so callers can show a warning instead
 * of a wrong number.
 */
export function convertWithRates(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  const fromRate = from === BASE_CURRENCY ? 1 : rates[from];
  const toRate = to === BASE_CURRENCY ? 1 : rates[to];
  if (!fromRate || !toRate) return null;
  return (amount * fromRate) / toRate;
}
