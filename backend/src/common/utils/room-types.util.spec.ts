import { RoomType } from '@prisma/client';
import {
  ROOM_TYPES,
  cleanRoomTypeName,
  collectCustomRoomTypes,
  customRoomTypeSpellings,
  hotelRoomTypeWhere,
  listingRoomTypeWhere,
  mergeHotelRoomTypes,
  mergeListingRoomTypes,
  normalizeCustomRoomTypes,
  normalizeRoomTypeValue,
  sortRoomTypes,
  toRoomType,
} from './room-types.util';

describe('ROOM_TYPES', () => {
  it('lists every predefined type in schema order', () => {
    expect(ROOM_TYPES).toHaveLength(11);
    expect(ROOM_TYPES[0]).toBe(RoomType.STANDARD_DOUBLE);
    expect(ROOM_TYPES[ROOM_TYPES.length - 1]).toBe(RoomType.DELUXE);
  });
});

describe('cleanRoomTypeName', () => {
  it('trims and collapses inner whitespace', () => {
    expect(cleanRoomTypeName('  Sea \t view\n suite ')).toBe('Sea view suite');
  });

  it('returns an empty string for blanks', () => {
    expect(cleanRoomTypeName('   ')).toBe('');
  });
});

describe('toRoomType', () => {
  it.each([
    ['STANDARD_DOUBLE', RoomType.STANDARD_DOUBLE],
    ['Standard double', RoomType.STANDARD_DOUBLE],
    ['junior-suite', RoomType.JUNIOR_SUITE],
    ['  Junior   suite ', RoomType.JUNIOR_SUITE],
    ['TRIPLE ROOM', RoomType.TRIPLE],
    ['Family rooms', RoomType.FAMILY],
    ['Connecting room', RoomType.CONNECTING],
    ['Deluxe room', RoomType.DELUXE],
    ['suite', RoomType.SUITE],
  ])('reads %p as a predefined type', (input, expected) => {
    expect(toRoomType(input)).toBe(expected);
  });

  it.each(['Sea view suite', 'Room', 'Люкс', '', '   '])(
    'returns null for %p',
    (input) => {
      expect(toRoomType(input)).toBeNull();
    },
  );
});

describe('sortRoomTypes', () => {
  it('drops duplicates and unknown values and keeps the schema order', () => {
    expect(
      sortRoomTypes(['SUITE', 'STANDARD_TWIN', 'SUITE', 'PENTHOUSE']),
    ).toEqual([RoomType.STANDARD_TWIN, RoomType.SUITE]);
  });

  it('handles a missing list', () => {
    expect(sortRoomTypes(undefined)).toEqual([]);
  });
});

describe('normalizeCustomRoomTypes', () => {
  it('cleans names, drops blanks and case-insensitive duplicates', () => {
    expect(
      normalizeCustomRoomTypes([' Sea  view ', '', 'sea VIEW', 'Garden villa']),
    ).toEqual({ matched: [], custom: ['Sea view', 'Garden villa'] });
  });

  it('moves names of predefined types out of the custom list', () => {
    expect(
      normalizeCustomRoomTypes(['Junior suite', 'Penthouse', 'family room']),
    ).toEqual({
      matched: [RoomType.JUNIOR_SUITE, RoomType.FAMILY],
      custom: ['Penthouse'],
    });
  });

  it('handles a missing list', () => {
    expect(normalizeCustomRoomTypes(undefined)).toEqual({
      matched: [],
      custom: [],
    });
  });
});

describe('normalizeRoomTypeValue', () => {
  it('stores a predefined type as its code', () => {
    expect(normalizeRoomTypeValue('  family room ')).toBe(RoomType.FAMILY);
    expect(normalizeRoomTypeValue('SUITE')).toBe(RoomType.SUITE);
  });

  it('keeps a custom name, tidied', () => {
    expect(normalizeRoomTypeValue(' Garden   villa ')).toBe('Garden villa');
  });

  it('turns blanks into null and leaves "not provided" alone', () => {
    expect(normalizeRoomTypeValue('  ')).toBeNull();
    expect(normalizeRoomTypeValue(null)).toBeNull();
    expect(normalizeRoomTypeValue(undefined)).toBeUndefined();
  });
});

describe('mergeListingRoomTypes', () => {
  it('adds predefined names typed in any language to the selection', () => {
    expect(
      mergeListingRoomTypes(
        [RoomType.SUITE, RoomType.STANDARD_TWIN],
        [['Sea view', 'Family room'], [' Deluxe ', 'Вид на море'], undefined],
      ),
    ).toEqual({
      roomTypes: [
        RoomType.STANDARD_TWIN,
        RoomType.FAMILY,
        RoomType.SUITE,
        RoomType.DELUXE,
      ],
      customRoomTypes: [['Sea view'], ['Вид на море'], []],
    });
  });

  it('replaces the stored selection when one is sent', () => {
    expect(
      mergeListingRoomTypes(
        [RoomType.TRIPLE],
        [['Garden villa']],
        [RoomType.SUITE],
      ),
    ).toEqual({
      roomTypes: [RoomType.TRIPLE],
      customRoomTypes: [['Garden villa']],
    });
    expect(mergeListingRoomTypes([], [], [RoomType.SUITE]).roomTypes).toEqual(
      [],
    );
  });

  it('keeps the stored selection on an update that leaves it out', () => {
    expect(
      mergeListingRoomTypes(
        undefined,
        [['Junior suite', 'Penthouse']],
        [RoomType.DELUXE],
      ),
    ).toEqual({
      roomTypes: [RoomType.JUNIOR_SUITE, RoomType.DELUXE],
      customRoomTypes: [['Penthouse']],
    });
  });

  it('leaves the selection untouched when nothing adds to it', () => {
    expect(
      mergeListingRoomTypes(undefined, [['Penthouse']], [RoomType.DELUXE]),
    ).toEqual({ roomTypes: undefined, customRoomTypes: [['Penthouse']] });
    expect(mergeListingRoomTypes(undefined, [])).toEqual({
      roomTypes: undefined,
      customRoomTypes: [],
    });
  });
});

describe('mergeHotelRoomTypes', () => {
  const stored = {
    roomTypes: [RoomType.SUITE],
    customRoomTypes: ['Penthouse'],
  };

  it('writes nothing when neither list is sent', () => {
    expect(mergeHotelRoomTypes({}, stored)).toBeUndefined();
    expect(mergeHotelRoomTypes({})).toBeUndefined();
  });

  it('replaces the selection and keeps the stored custom names', () => {
    expect(
      mergeHotelRoomTypes({ roomTypes: [RoomType.TRIPLE] }, stored),
    ).toEqual({ roomTypes: [RoomType.TRIPLE], customRoomTypes: ['Penthouse'] });
  });

  it('replaces the custom names and keeps the stored selection', () => {
    expect(
      mergeHotelRoomTypes(
        { customRoomTypes: [' Garden  villa ', 'garden villa', 'Family room'] },
        stored,
      ),
    ).toEqual({
      roomTypes: [RoomType.FAMILY, RoomType.SUITE],
      customRoomTypes: ['Garden villa'],
    });
  });

  it('clears both lists when empty ones are sent', () => {
    expect(
      mergeHotelRoomTypes({ roomTypes: [], customRoomTypes: [] }, stored),
    ).toEqual({ roomTypes: [], customRoomTypes: [] });
  });

  it('starts from empty lists for a new entry', () => {
    expect(
      mergeHotelRoomTypes({ customRoomTypes: ['Deluxe', 'Penthouse'] }),
    ).toEqual({ roomTypes: [RoomType.DELUXE], customRoomTypes: ['Penthouse'] });
  });
});

describe('collectCustomRoomTypes', () => {
  it('lists each name once, first spelling wins, sorted', () => {
    expect(
      collectCustomRoomTypes([
        ['Sea view', 'penthouse'],
        ['Penthouse', ' Garden  villa ', ''],
        [],
        ['SEA VIEW'],
      ]),
    ).toEqual(['Garden villa', 'penthouse', 'Sea view']);
  });
});

describe('room-type filters', () => {
  it('filters predefined types on the selection', () => {
    expect(hotelRoomTypeWhere('FAMILY')).toEqual({
      roomTypes: { has: RoomType.FAMILY },
    });
    expect(listingRoomTypeWhere('Junior suite')).toEqual({
      roomTypes: { has: RoomType.JUNIOR_SUITE },
    });
  });

  it('filters any other name on the custom names', () => {
    expect(hotelRoomTypeWhere(' Sea  view ')).toEqual({
      customRoomTypes: { hasSome: ['Sea view'] },
    });
    expect(listingRoomTypeWhere('Вид на море')).toEqual({
      localizations: {
        some: { customRoomTypes: { hasSome: ['Вид на море'] } },
      },
    });
  });

  it('matches every stored spelling of a custom name', () => {
    expect(
      hotelRoomTypeWhere('Sea view', ['Sea view', 'sea VIEW', 'Sea View']),
    ).toEqual({
      customRoomTypes: { hasSome: ['Sea view', 'sea VIEW', 'Sea View'] },
    });
    expect(listingRoomTypeWhere('villa', ['Villa'])).toEqual({
      localizations: { some: { customRoomTypes: { hasSome: ['Villa'] } } },
    });
  });
});

describe('customRoomTypeSpellings', () => {
  it('collects every stored spelling of a name, ignoring case and spacing', () => {
    expect(
      customRoomTypeSpellings(' sea  VIEW ', [
        ['Sea view', 'Penthouse'],
        ['Sea View'],
        [],
        ['sea view', 'Seaview'],
      ]),
    ).toEqual(['sea VIEW', 'Sea view', 'Sea View', 'sea view']);
  });

  it('still looks for the name itself when nothing is stored', () => {
    expect(customRoomTypeSpellings('Garden villa', [])).toEqual([
      'Garden villa',
    ]);
  });
});
