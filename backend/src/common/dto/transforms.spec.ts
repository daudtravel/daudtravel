import 'reflect-metadata'; // loaded by main.ts at runtime; needed standalone here
import { plainToInstance, Transform } from 'class-transformer';
import {
  toNullableNumber,
  toOptionalBoolean,
  toStringArray,
  toStringArrayAllowEmpty,
  trimToNull,
} from './transforms';

class Query {
  @Transform(toOptionalBoolean)
  isPublic?: boolean;
}

describe('toOptionalBoolean', () => {
  const parse = (value: unknown) =>
    plainToInstance(
      Query,
      { isPublic: value },
      { enableImplicitConversion: true },
    ).isPublic;

  // The global ValidationPipe uses enableImplicitConversion, which coerces the
  // string "false" to true unless the raw value is read.
  it('parses query strings with implicit conversion enabled', () => {
    expect(parse('true')).toBe(true);
    expect(parse('false')).toBe(false);
  });

  it('accepts real booleans', () => {
    expect(parse(true)).toBe(true);
    expect(parse(false)).toBe(false);
  });

  it('ignores anything else', () => {
    expect(parse(undefined)).toBeUndefined();
    expect(parse('')).toBeUndefined();
    expect(parse('yes')).toBeUndefined();
  });
});

describe('trimToNull', () => {
  it('turns blank strings into null and trims the rest', () => {
    expect(trimToNull({ value: '  ' })).toBeNull();
    expect(trimToNull({ value: ' +995 555 ' })).toBe('+995 555');
    expect(trimToNull({ value: null })).toBeNull();
  });
});

describe('toStringArray', () => {
  it('splits comma lists and drops empties', () => {
    expect(toStringArray({ value: 'a, b ,,c' })).toEqual(['a', 'b', 'c']);
    expect(toStringArray({ value: ['a', ' b '] })).toEqual(['a', 'b']);
    expect(toStringArray({ value: '' })).toBeUndefined();
  });
});

describe('toStringArrayAllowEmpty', () => {
  it('treats a blank value as "clear the list", not "not provided"', () => {
    expect(toStringArrayAllowEmpty({ value: '' })).toEqual([]);
    expect(toStringArrayAllowEmpty({ value: null })).toEqual([]);
    expect(toStringArrayAllowEmpty({ value: undefined })).toBeUndefined();
    expect(toStringArrayAllowEmpty({ value: 'ka, en' })).toEqual(['ka', 'en']);
  });
});

describe('toNullableNumber', () => {
  class Form {
    @Transform(toNullableNumber)
    price?: number | null;
  }
  const parse = (value: unknown) =>
    plainToInstance(Form, { price: value }, { enableImplicitConversion: true })
      .price;

  it('keeps numbers, clears blanks and leaves junk for the validator', () => {
    // multipart form fields arrive as strings
    expect(parse('180.50')).toBe(180.5);
    expect(parse(12)).toBe(12);
    expect(parse('')).toBeNull();
    expect(parse('   ')).toBeNull();
    expect(parse(null)).toBeNull();
    expect(parse('abc')).toBe('abc');
  });
});
