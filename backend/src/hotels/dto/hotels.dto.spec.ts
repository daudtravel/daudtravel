import 'reflect-metadata'; // loaded by main.ts at runtime; needed standalone here
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoomType } from '@prisma/client';
import {
  CreateHotelDto,
  ListHotelsQueryDto,
  UpdateHotelDto,
} from './hotels.dto';

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

const hotel = { name: 'Rooms Hotel', city: 'Tbilisi' };

describe('CreateHotelDto room types and listing link', () => {
  it('accepts room types, custom names and a listing', async () => {
    const { dto, errors } = await parse(CreateHotelDto, {
      ...hotel,
      roomTypes: [RoomType.FAMILY, RoomType.SUITE],
      customRoomTypes: [' Sea view ', 'Garden villa'],
      accommodationId: ' cm1listing ',
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([RoomType.FAMILY, RoomType.SUITE]);
    expect(dto.customRoomTypes).toEqual(['Sea view', 'Garden villa']);
    expect(dto.accommodationId).toBe('cm1listing');
  });

  it('rejects an unknown room type', async () => {
    const { errors } = await parse(CreateHotelDto, {
      ...hotel,
      roomTypes: ['PENTHOUSE'],
    });
    expect(errors).toEqual(['roomTypes']);
  });

  it('turns null lists into empty ones and a blank listing into null', async () => {
    const { dto, errors } = await parse(CreateHotelDto, {
      ...hotel,
      roomTypes: null,
      customRoomTypes: null,
      accommodationId: '  ',
    });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toEqual([]);
    expect(dto.customRoomTypes).toEqual([]);
    expect(dto.accommodationId).toBeNull();
  });

  it('limits the custom names to 20 of up to 60 characters', async () => {
    const many = Array.from({ length: 21 }, (_, i) => `Villa ${i + 1}`);
    expect(
      (await parse(CreateHotelDto, { ...hotel, customRoomTypes: many })).errors,
    ).toEqual(['customRoomTypes']);
    expect(
      (
        await parse(CreateHotelDto, {
          ...hotel,
          customRoomTypes: ['x'.repeat(61)],
        })
      ).errors,
    ).toEqual(['customRoomTypes']);
    expect(
      (
        await parse(CreateHotelDto, {
          ...hotel,
          customRoomTypes: ['x'.repeat(60)],
        })
      ).errors,
    ).toEqual([]);
  });
});

describe('UpdateHotelDto room types', () => {
  it('leaves lists that are not sent undefined, so they are kept', async () => {
    const { dto, errors } = await parse(UpdateHotelDto, { notes: 'Renovated' });
    expect(errors).toEqual([]);
    expect(dto.roomTypes).toBeUndefined();
    expect(dto.customRoomTypes).toBeUndefined();
    expect(dto.accommodationId).toBeUndefined();
  });

  it('keeps null for unlinking the listing', async () => {
    const { dto, errors } = await parse(UpdateHotelDto, {
      accommodationId: null,
    });
    expect(errors).toEqual([]);
    expect(dto.accommodationId).toBeNull();
  });
});

describe('ListHotelsQueryDto room-type and listing filters', () => {
  it('parses query strings', async () => {
    const { dto, errors } = await parse(ListHotelsQueryDto, {
      roomType: ' Sea view ',
      hasListing: 'false',
    });
    expect(errors).toEqual([]);
    expect(dto.roomType).toBe('Sea view');
    expect(dto.hasListing).toBe(false);

    const linked = await parse(ListHotelsQueryDto, {
      roomType: '  ',
      hasListing: 'true',
    });
    expect(linked.dto.roomType).toBeUndefined();
    expect(linked.dto.hasListing).toBe(true);
  });

  it('rejects a room type longer than a custom name can be', async () => {
    const { errors } = await parse(ListHotelsQueryDto, {
      roomType: 'x'.repeat(61),
    });
    expect(errors).toEqual(['roomType']);
  });
});
