import 'reflect-metadata'; // loaded by main.ts at runtime; needed standalone here
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoomType } from '@prisma/client';
import {
  CreateAccommodationDto,
  GetAccommodationsQueryDto,
  UpdateAccommodationDto,
} from './accommodations.dto';

// Mirrors the global ValidationPipe (main.ts)
async function parse<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
) {
  const dto = plainToInstance(cls, plain, { enableImplicitConversion: true });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors: errors.map((error) => error.property) };
}

const localization = {
  locale: 'en',
  name: 'Old Town Rooms',
  description: 'Near the baths.',
};

const listing = {
  localizations: [localization],
  type: 'HOTEL',
  price: 120,
  city: 'Tbilisi',
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  mainImage: 'data:image/png;base64,AAAA',
};

describe('CreateAccommodationDto room types', () => {
  it('accepts room types and custom names per language', async () => {
    const { dto, errors } = await parse(CreateAccommodationDto, {
      ...listing,
      roomTypes: [RoomType.STANDARD_DOUBLE, RoomType.FAMILY],
      localizations: [
        { ...localization, customRoomTypes: ['Sea view', ' Garden villa '] },
        { ...localization, locale: 'ka', customRoomTypes: [] },
      ],
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([RoomType.STANDARD_DOUBLE, RoomType.FAMILY]);
    expect(dto.localizations[0].customRoomTypes).toEqual([
      'Sea view',
      'Garden villa',
    ]);
    expect(dto.localizations[1].customRoomTypes).toEqual([]);
  });

  it('defaults to no room types and leaves custom names unset', async () => {
    const { dto, errors } = await parse(CreateAccommodationDto, listing);
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([]);
    expect(dto.localizations[0].customRoomTypes).toBeUndefined();
  });

  it('rejects an unknown room type', async () => {
    const { errors } = await parse(CreateAccommodationDto, {
      ...listing,
      roomTypes: [RoomType.SUITE, 'PENTHOUSE'],
    });
    expect(errors).toEqual(['roomTypes']);
  });

  it('turns null lists into empty ones', async () => {
    const { dto, errors } = await parse(CreateAccommodationDto, {
      ...listing,
      roomTypes: null,
      localizations: [{ ...localization, customRoomTypes: null }],
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([]);
    expect(dto.localizations[0].customRoomTypes).toEqual([]);
  });

  it('limits custom names to 20 of up to 60 characters per language', async () => {
    const withCustom = (customRoomTypes: string[]) =>
      parse(CreateAccommodationDto, {
        ...listing,
        localizations: [{ ...localization, customRoomTypes }],
      });
    const many = Array.from({ length: 21 }, (_, i) => `Villa ${i + 1}`);
    expect((await withCustom(many)).errors).toEqual(['localizations']);
    expect((await withCustom(['x'.repeat(61)])).errors).toEqual([
      'localizations',
    ]);
    expect((await withCustom(['x'.repeat(60)])).errors).toEqual([]);
  });
});

describe('UpdateAccommodationDto room types', () => {
  it('leaves room types undefined when not sent, so they are kept', async () => {
    const { dto, errors } = await parse(UpdateAccommodationDto, {
      city: 'Batumi',
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toBeUndefined();
  });

  it('accepts a cleared selection', async () => {
    const { dto, errors } = await parse(UpdateAccommodationDto, {
      roomTypes: [],
      localizations: [{ ...localization, customRoomTypes: ['Penthouse'] }],
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([]);
    expect(dto.localizations?.[0].customRoomTypes).toEqual(['Penthouse']);
  });
});

describe('GetAccommodationsQueryDto room-type and directory filters', () => {
  it('parses query strings', async () => {
    const { dto, errors } = await parse(GetAccommodationsQueryDto, {
      roomType: ' FAMILY ',
      inDirectory: 'false',
    });
    expect(errors).toEqual([]);
    expect(dto.roomType).toBe('FAMILY');
    expect(dto.inDirectory).toBe(false);

    const linked = await parse(GetAccommodationsQueryDto, {
      roomType: '',
      inDirectory: 'true',
    });
    expect(linked.dto.roomType).toBeUndefined();
    expect(linked.dto.inDirectory).toBe(true);
  });

  it('rejects a room type longer than a custom name can be', async () => {
    const { errors } = await parse(GetAccommodationsQueryDto, {
      roomType: 'x'.repeat(61),
    });
    expect(errors).toEqual(['roomType']);
  });
});
