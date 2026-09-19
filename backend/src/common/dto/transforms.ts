type TransformArgs = { value: unknown };

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

/** Parses "true"/"false" query strings; anything else → undefined. */
export const toOptionalBoolean = ({ value }: TransformArgs) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

/** Accepts `a,b,c` or repeated query params and returns a clean string array. */
export const toStringArray = ({
  value,
}: TransformArgs): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
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
};
