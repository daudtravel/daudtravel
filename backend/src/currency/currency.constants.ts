import { Currency } from '@prisma/client';

/** Base currency: every stored rate says how many GEL one unit costs. */
export const BASE_CURRENCY: Currency = Currency.GEL;

export const SUPPORTED_CURRENCIES: Currency[] = Object.values(Currency);

/** Currencies that actually need a rate (everything except the base). */
export const RATE_CURRENCIES: Currency[] = SUPPORTED_CURRENCIES.filter(
  (c) => c !== BASE_CURRENCY,
);

export const NBG_URL =
  'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/';

/** Fallback provider (rates relative to GEL); used for SAR and NBG outages. */
export const FALLBACK_URL = 'https://open.er-api.com/v6/latest/GEL';

export const PROVIDER_TIMEOUT_MS = 10_000;

export const RATE_SORT_FIELDS = ['date', 'currency', 'rate'] as const;

/**
 * A rate counts as outdated only after this many days: NBG publishes on
 * working days, so on a Monday the Friday rate is still the official one.
 */
export const STALE_AFTER_DAYS = 3;
