import { BadRequestException } from '@nestjs/common';
import {
  formatDateOnly,
  parseDateOnly,
  parseDateRange,
  parseOptionalDateOnly,
} from './date-only.util';

describe('parseDateOnly', () => {
  it('parses to UTC midnight', () => {
    expect(parseDateOnly('2026-09-19').toISOString()).toBe(
      '2026-09-19T00:00:00.000Z',
    );
  });

  it('rejects impossible calendar dates', () => {
    expect(() => parseDateOnly('2026-02-30')).toThrow(BadRequestException);
    expect(() => parseDateOnly('2026-13-01')).toThrow(BadRequestException);
  });

  it('rejects other formats', () => {
    expect(() => parseDateOnly('19.09.2026')).toThrow(BadRequestException);
    expect(() => parseDateOnly('2026-9-1')).toThrow(BadRequestException);
  });

  it('accepts leap days', () => {
    expect(formatDateOnly(parseDateOnly('2028-02-29'))).toBe('2028-02-29');
  });
});

describe('parseOptionalDateOnly', () => {
  it('maps empty values to null', () => {
    expect(parseOptionalDateOnly('')).toBeNull();
    expect(parseOptionalDateOnly(null)).toBeNull();
    expect(parseOptionalDateOnly(undefined)).toBeNull();
  });
});

describe('parseDateRange', () => {
  it('returns undefined without bounds', () => {
    expect(parseDateRange()).toBeUndefined();
  });

  it('makes dateTo inclusive (whole day)', () => {
    const range = parseDateRange('2026-09-01', '2026-09-30');
    expect(range?.gte?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(range?.lt?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('allows a single day', () => {
    const range = parseDateRange('2026-09-19', '2026-09-19');
    expect(range?.lt?.toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('rejects from > to', () => {
    expect(() => parseDateRange('2026-10-01', '2026-09-01')).toThrow(
      'INVALID_DATE_RANGE',
    );
  });
});
