import { BadRequestException } from '@nestjs/common';

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a YYYY-MM-DD string to a UTC-midnight Date (how Postgres `date`
 * columns round-trip through Prisma). Rejects impossible dates like 2026-02-30.
 */
export function parseDateOnly(value: string, field = 'date'): Date {
  const match = DATE_ONLY.exec(value);
  if (!match) {
    throw new BadRequestException(`${field} must be YYYY-MM-DD`);
  }
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new BadRequestException(`${field} is not a valid date`);
  }
  return date;
}

export function parseOptionalDateOnly(
  value: string | null | undefined,
  field = 'date',
): Date | null {
  if (value === null || value === undefined || value === '') return null;
  return parseDateOnly(value, field);
}

/** Formats a Date as YYYY-MM-DD using its UTC calendar day. */
export function formatDateOnly(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Inclusive date range → Prisma filter. `dateTo` includes the whole day.
 * Throws INVALID_DATE_RANGE when from > to.
 */
export function parseDateRange(
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lt?: Date } | undefined {
  const from = dateFrom ? parseDateOnly(dateFrom, 'dateFrom') : undefined;
  const to = dateTo ? parseDateOnly(dateTo, 'dateTo') : undefined;
  if (from && to && from > to) {
    throw new BadRequestException('INVALID_DATE_RANGE');
  }
  if (!from && !to) return undefined;
  const range: { gte?: Date; lt?: Date } = {};
  if (from) range.gte = from;
  if (to) range.lt = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  return range;
}
