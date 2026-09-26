/**
 * Formatting helpers for the back office. Numbers use Latin digits in every
 * locale (including Arabic) so amounts line up in tables and printouts.
 */

const INTL_LOCALES: Record<string, string> = {
  ka: "ka-GE",
  en: "en-GB",
  ru: "ru-RU",
  ar: "ar-u-nu-latn",
  tr: "tr-TR",
};

export const intlLocale = (locale: string) => INTL_LOCALES[locale] ?? "en-GB";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses `YYYY-MM-DD` (or an ISO string starting with it) as a LOCAL calendar
 * date so it never shifts by a day because of the viewer's time zone.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = DATE_ONLY.exec(value.slice(0, 10));
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return new Date(y, m - 1, d);
}

/** Local `Date` → `YYYY-MM-DD`. */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
): string {
  if (!value) return "—";
  const date =
    value instanceof Date
      ? value
      : DATE_ONLY.test(value)
        ? parseDateOnly(value)
        : new Date(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(date);
}

/** Formats a date-only value (YYYY-MM-DD / ISO) without time-zone shifts. */
export function formatDateOnly(
  value: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDateOnly(value);
  return date ? formatDate(date, locale, options) : "—";
}

export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string
): string {
  return formatDate(value, locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(
  value: number | string | null | undefined,
  locale: string,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }
): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), options).format(num);
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: string,
  locale: string
): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      // "₾120.00" rather than "GEL 120.00"
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${formatNumber(num, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
}

export function fullName(person?: {
  firstName?: string | null;
  lastName?: string | null;
} | null): string {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || "—";
}

export function initials(person?: {
  firstName?: string | null;
  lastName?: string | null;
} | null): string {
  const a = person?.firstName?.trim()?.[0] ?? "";
  const b = person?.lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}
