// Must stay in sync with enum RoomType in backend/prisma/schema.prisma
// (and ROOM_TYPES in backend/src/common/utils/room-types.util.ts).
// Labels live in the "accommodations" namespace: roomTypeLabels.<CODE>.
export const ROOM_TYPES = [
  "STANDARD_DOUBLE",
  "STANDARD_TWIN",
  "TRIPLE",
  "FAMILY",
  "CONNECTING",
  "SUPERIOR_DOUBLE",
  "SUPERIOR_TRIPLE",
  "JUNIOR_SUITE",
  "EXECUTIVE_SUITE",
  "SUITE",
  "DELUXE",
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

/** Limits for room types typed by hand (enforced by the API too). */
export const CUSTOM_ROOM_TYPE_MAX_LENGTH = 60;
export const CUSTOM_ROOM_TYPES_MAX = 20;

export const isRoomType = (value: unknown): value is RoomType =>
  typeof value === "string" && (ROOM_TYPES as readonly string[]).includes(value);

/** "  Sea   view suite " → "Sea view suite" */
export const cleanRoomTypeName = (value: string) =>
  value.replace(/\s+/g, " ").trim();

/** Known codes only, without duplicates, in list order. */
export const sortRoomTypes = (values: readonly string[] | undefined) =>
  ROOM_TYPES.filter((type) => values?.includes(type));

/**
 * The predefined type a typed name stands for, if any — by code
 * ("JUNIOR_SUITE", "junior-suite", "Triple room") or by its label in the
 * current language ("Люкс" while the panel is in Russian). Mirrors toRoomType
 * on the API, which only knows the codes.
 */
export function matchRoomType(
  value: string,
  labelOf?: (type: RoomType) => string
): RoomType | null {
  const name = cleanRoomTypeName(value);
  if (!name) return null;

  const key = name.toUpperCase().replace(/[\s-]+/g, "_");
  for (const candidate of [key, key.replace(/_ROOMS?$/, "")]) {
    if (isRoomType(candidate)) return candidate;
  }

  if (labelOf) {
    const lower = name.toLocaleLowerCase();
    const byLabel = ROOM_TYPES.find(
      (type) => cleanRoomTypeName(labelOf(type)).toLocaleLowerCase() === lower
    );
    if (byLabel) return byLabel;
  }
  return null;
}

/**
 * Tidies custom names: whitespace collapsed, blanks and case-insensitive
 * duplicates dropped (the first spelling wins).
 */
export function dedupeCustomRoomTypes(values: readonly string[] | undefined) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values ?? []) {
    const name = cleanRoomTypeName(value);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}
