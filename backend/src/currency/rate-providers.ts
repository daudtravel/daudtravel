import { Currency, RateSource } from '@prisma/client';
import {
  FALLBACK_URL,
  NBG_URL,
  PROVIDER_TIMEOUT_MS,
  RATE_CURRENCIES,
} from './currency.constants';

export interface FetchedRate {
  currency: Currency;
  /** GEL per 1 unit. */
  rate: number;
  date: string; // YYYY-MM-DD
  source: RateSource;
}

interface NbgCurrency {
  code?: string;
  /** The rate is quoted per this many units (e.g. RUB per 100). */
  quantity?: number;
  rate?: number;
  validFromDate?: string;
  date?: string;
}

interface NbgDay {
  date?: string;
  currencies?: NbgCurrency[];
}

const isRateCode = (code: string): code is Currency =>
  (RATE_CURRENCIES as string[]).includes(code);

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`${url} responded ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

const dayOf = (value: string | undefined, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : fallback;

/**
 * Official rates from the National Bank of Georgia. NBG quotes some currencies
 * per 10/100/1000 units, so each rate is divided by its quantity. SAR is not
 * published by NBG — the fallback provider covers it.
 */
export async function fetchNbgRates(today: string): Promise<FetchedRate[]> {
  const payload = await getJson(NBG_URL);
  const days = Array.isArray(payload) ? (payload as NbgDay[]) : [];
  const currencies = days[0]?.currencies ?? [];
  const out: FetchedRate[] = [];

  for (const entry of currencies) {
    const code = entry.code?.toUpperCase();
    if (!code || !isRateCode(code)) continue;
    const quantity = Number(entry.quantity) || 1;
    const rate = Number(entry.rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    out.push({
      currency: code,
      rate: rate / quantity,
      date: dayOf(entry.validFromDate ?? entry.date ?? days[0]?.date, today),
      source: RateSource.NBG,
    });
  }
  return out;
}

/** open.er-api.com returns units per 1 GEL, so the rate is inverted. */
export async function fetchFallbackRates(
  today: string,
  only?: Currency[],
): Promise<FetchedRate[]> {
  const payload = (await getJson(FALLBACK_URL)) as {
    result?: string;
    rates?: Record<string, number>;
  };
  if (payload?.result !== 'success' || !payload.rates) {
    throw new Error('fallback provider returned no rates');
  }

  const wanted = only ?? RATE_CURRENCIES;
  const out: FetchedRate[] = [];
  for (const currency of wanted) {
    const perGel = Number(payload.rates[currency]);
    if (!Number.isFinite(perGel) || perGel <= 0) continue;
    out.push({
      currency,
      rate: 1 / perGel,
      date: today,
      source: RateSource.EXCHANGERATE_API,
    });
  }
  return out;
}
