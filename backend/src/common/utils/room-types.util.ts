import { Prisma, RoomType } from '@prisma/client';

/** Every predefined room type, in the order the schema lists them. */
export const ROOM_TYPES = Object.values(RoomType) as RoomType[];

/** Limits for room types typed by hand (mirrored in the frontend forms). */
export const CUSTOM_ROOM_TYPE_MAX_LENGTH = 60;
export const CUSTOM_ROOM_TYPES_MAX = 20;

/** "  Sea   view suite " → "Sea view suite" */
export function cleanRoomTypeName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * The predefined type a typed name stands for, if any: "Junior suite",
 * "junior-suite" and "TRIPLE ROOM" all read as their code. A trailing
 * "room(s)" is ignored, so the names on the brief ("Family room") match too.
 */
export function toRoomType(value: string): RoomType | null {
  const key = cleanRoomTypeName(value)
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (!key) return null;
  for (const candidate of [key, key.replace(/_ROOMS?$/, '')]) {
    if ((ROOM_TYPES as string[]).includes(candidate)) {
      return candidate as RoomType;
    }
  }
  return null;
}

/** Known codes only, without duplicates, in schema order. */
export function sortRoomTypes(
  values: readonly string[] | undefined,
): RoomType[] {
  if (!values?.length) return [];
  return ROOM_TYPES.filter((type) => values.includes(type));
}

/**
 * Tidies room types typed by hand before they are stored: whitespace is
 * collapsed, blanks and case-insensitive duplicates are dropped (the first
 * spelling wins), and a name that is really a predefined type is returned in
 * `matched` instead, so it is selected rather than listed twice.
 */
export function normalizeCustomRoomTypes(
  values: readonly string[] | undefined,
): {
  matched: RoomType[];
  custom: string[];
} {
  const matched: RoomType[] = [];
  const custom: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const name = cleanRoomTypeName(value);
    if (!name) continue;

    const type = toRoomType(name);
    if (type) {
      if (!matched.includes(type)) matched.push(type);
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    custom.push(name);
  }

  return { matched, custom };
}

/**
 * A booking line keeps its room type as one text value: the code when it is a
 * predefined type (so it shows translated), otherwise the name as typed.
 * `undefined` means "not provided" and is passed through.
 */
export function normalizeRoomTypeValue(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const name = cleanRoomTypeName(value);
  if (!name) return null;
  return toRoomType(name) ?? name;
}

/**
 * Room types of a website listing as they are stored. Each language's custom
 * names are tidied, and a name that is really a predefined type (in any
 * language) is selected instead. A sent selection replaces the stored one;
 * without one (an update that leaves it out) the stored selection is kept,
 * plus any such names, and `roomTypes` is undefined when nothing changes.
 * `customRoomTypes` lines up with `customLists`.
 */
export function mergeListingRoomTypes(
  selected: readonly string[] | undefined,
  customLists: readonly (readonly string[] | undefined)[],
  stored: readonly string[] = [],
): { roomTypes: RoomType[] | undefined; customRoomTypes: string[][] } {
  const matched: RoomType[] = [];
  const customRoomTypes = customLists.map((list) => {
    const result = normalizeCustomRoomTypes(list);
    matched.push(...result.matched);
    return result.custom;
  });

  let roomTypes: RoomType[] | undefined;
  if (selected !== undefined) {
    roomTypes = sortRoomTypes([...selected, ...matched]);
  } else if (matched.length) {
    roomTypes = sortRoomTypes([...stored, ...matched]);
  }
  return { roomTypes, customRoomTypes };
}

/**
 * Room types of a hotel-directory entry after a save, like its contacts: a
 * list that is sent replaces the stored one, a list that is left out is kept.
 * Custom names are tidied and those that are really predefined types are
 * selected instead. Undefined when neither list was sent (nothing to write).
 */
export function mergeHotelRoomTypes(
  input: {
    roomTypes?: readonly string[];
    customRoomTypes?: readonly string[];
  },
  stored: {
    roomTypes: readonly string[];
    customRoomTypes: readonly string[];
  } = { roomTypes: [], customRoomTypes: [] },
): { roomTypes: RoomType[]; customRoomTypes: string[] } | undefined {
  if (input.roomTypes === undefined && input.customRoomTypes === undefined) {
    return undefined;
  }
  const { matched, custom } = normalizeCustomRoomTypes(
    input.customRoomTypes ?? stored.customRoomTypes,
  );
  return {
    roomTypes: sortRoomTypes([
      ...(input.roomTypes ?? stored.roomTypes),
      ...matched,
    ]),
    customRoomTypes: custom,
  };
}

/**
 * Every custom name once, for a filter list: case-insensitive duplicates are
 * dropped (the first spelling wins) and the rest sorted alphabetically.
 */
export function collectCustomRoomTypes(
  lists: readonly (readonly string[])[],
): string[] {
  const names = new Map<string, string>();
  for (const list of lists) {
    for (const value of list) {
      const name = cleanRoomTypeName(value);
      const key = name.toLowerCase();
      if (name && !names.has(key)) names.set(key, name);
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Every stored spelling of a custom name ("Sea view", "sea VIEW"…). The filter
 * lists merge names that differ only in case, and Postgres compares array
 * items exactly, so a filter has to look for all of them.
 */
export function customRoomTypeSpellings(
  value: string,
  lists: readonly (readonly string[])[],
): string[] {
  const name = cleanRoomTypeName(value);
  const key = name.toLowerCase();
  const spellings = new Set<string>([name]);
  for (const list of lists) {
    for (const stored of list) {
      if (cleanRoomTypeName(stored).toLowerCase() === key) {
        spellings.add(stored);
      }
    }
  }
  return [...spellings];
}

/**
 * Hotel-directory filter: a predefined type ("FAMILY", or typed as
 * "Family room") or the name of a custom one, in any of its stored
 * spellings (see customRoomTypeSpellings; the name alone without them).
 */
export function hotelRoomTypeWhere(
  value: string,
  spellings: readonly string[] = [cleanRoomTypeName(value)],
): Prisma.HotelWhereInput {
  const type = toRoomType(value);
  return type
    ? { roomTypes: { has: type } }
    : { customRoomTypes: { hasSome: [...spellings] } };
}

/** Same for website listings, whose custom names are kept per language. */
export function listingRoomTypeWhere(
  value: string,
  spellings: readonly string[] = [cleanRoomTypeName(value)],
): Prisma.AccommodationWhereInput {
  const type = toRoomType(value);
  return type
    ? { roomTypes: { has: type } }
    : {
        localizations: {
          some: { customRoomTypes: { hasSome: [...spellings] } },
        },
      };
}
