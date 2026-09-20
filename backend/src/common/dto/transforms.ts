type TransformArgs = { value: unknown; obj?: unknown; key?: string };

/** Trims strings; empty → undefined ("not provided"). */
export const trimToUndefined = ({ value }: TransformArgs) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/** Trims strings; empty → null ("clear this field" on updates). */
export const trimToNull = ({ value }: TransformArgs) => {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const trimString = ({ value }: TransformArgs) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Parses "true"/"false" query strings; anything else → undefined.
 *
 * Reads the RAW value from the incoming object: the global ValidationPipe runs
 * with `enableImplicitConversion`, which would otherwise coerce the string
 * "false" to boolean `true` before this transform sees it.
 */
export const toOptionalBoolean = ({ value, obj, key }: TransformArgs) => {
  const raw =
    obj && key && typeof obj === 'object'
      ? (obj as Record<string, unknown>)[key]
      : value;
  if (raw === true || raw === 'true') return true;
  if (raw === false || raw === 'false') return false;
  return undefined;
};

/**
 * Number fields that can also be cleared: "" / null → null, numeric strings →
 * number, anything else is left untouched so `@IsNumber()` rejects it.
 *
 * Reads the RAW value for the same reason as `toOptionalBoolean`, and because
 * multipart forms (driver photo upload) send every field as a string.
 */
export const toNullableNumber = ({ value, obj, key }: TransformArgs) => {
  const raw =
    obj && key && typeof obj === 'object'
      ? (obj as Record<string, unknown>)[key]
      : value;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  return raw;
};

/** For loose `@Query('flag')` params: "true"/"false" → boolean, else undefined. */
export const parseBooleanParam = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

/** Accepts `a,b,c` or repeated query params and returns a clean string array. */
export const toStringArray = ({
  value,
}: TransformArgs): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return cleanStringList(value);
};

/**
 * Same, but an empty value means "an empty list" instead of "not provided" —
 * for form fields that can be cleared (a driver's languages, say).
 */
export const toStringArrayAllowEmpty = ({
  value,
}: TransformArgs): string[] | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  return cleanStringList(value) ?? [];
};

function cleanStringList(value: unknown): string[] | undefined {
  const list: unknown[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const cleaned = list
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v !== '');
  return cleaned.length ? cleaned : undefined;
}
