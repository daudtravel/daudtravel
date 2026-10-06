import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionModule, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import type { AuthUser } from '@/access/access.types';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  collectCustomRoomTypes,
  customRoomTypeSpellings,
  hotelRoomTypeWhere,
  mergeHotelRoomTypes,
  toRoomType,
} from '@/common/utils/room-types.util';
import {
  CreateHotelDto,
  HOTEL_SORT_FIELDS,
  HotelContactDto,
  ListHotelsQueryDto,
  UpdateHotelDto,
} from './dto/hotels.dto';
import { listingLinkErrorCode } from './listing-link.util';

const MODULE = PermissionModule.HOTELS;

const HOTEL_SELECT = {
  id: true,
  name: true,
  city: true,
  region: true,
  address: true,
  stars: true,
  category: true,
  priceFrom: true,
  priceCurrency: true,
  website: true,
  commissionRate: true,
  notes: true,
  isActive: true,
  roomTypes: true,
  customRoomTypes: true,
  accommodationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  accommodation: {
    select: {
      id: true,
      type: true,
      city: true,
      price: true,
      mainImage: true,
      isPublic: true,
      localizations: { select: { locale: true, name: true } },
    },
  },
  contacts: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: {
      id: true,
      type: true,
      name: true,
      phone: true,
      email: true,
      note: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.HotelSelect;

type HotelRow = Prisma.HotelGetPayload<{ select: typeof HOTEL_SELECT }>;

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private format(row: HotelRow) {
    return {
      ...row,
      priceFrom: row.priceFrom !== null ? Number(row.priceFrom) : null,
      commissionRate:
        row.commissionRate !== null ? Number(row.commissionRate) : null,
      accommodation: row.accommodation && {
        ...row.accommodation,
        price: Number(row.accommodation.price),
      },
    };
  }

  /** A contact nobody can be reached on is a data-entry mistake. */
  private prepareContacts(contacts: HotelContactDto[] | undefined) {
    if (contacts === undefined) return undefined;
    return contacts.map((contact, index) => {
      if (!contact.phone && !contact.email) {
        throw new BadRequestException('CONTACT_NEEDS_PHONE_OR_EMAIL');
      }
      return {
        type: contact.type,
        name: contact.name ?? null,
        phone: contact.phone ?? null,
        email: contact.email ?? null,
        note: contact.note ?? null,
        sortOrder: contact.sortOrder ?? index,
      };
    });
  }

  /**
   * A website listing fills one directory entry at most. Nothing to check
   * when the link is left alone (undefined) or removed (null); re-saving the
   * entry's own link is fine.
   */
  private async assertListingFree(
    accommodationId: string | null | undefined,
    hotelId?: string,
  ) {
    if (!accommodationId) return;
    const listing = await this.prisma.accommodation.findUnique({
      where: { id: accommodationId },
      select: { hotel: { select: { id: true } } },
    });
    if (!listing) throw new BadRequestException('ACCOMMODATION_NOT_FOUND');
    if (listing.hotel && listing.hotel.id !== hotelId) {
      throw new ConflictException('ACCOMMODATION_ALREADY_LINKED');
    }
  }

  /**
   * A save that raced past assertListingFree (the listing was linked
   * elsewhere or deleted meanwhile) gets the same answer from the database.
   */
  private mapListingError(error: unknown) {
    const code = listingLinkErrorCode(error);
    if (code === 'ACCOMMODATION_ALREADY_LINKED') {
      return new ConflictException(code);
    }
    if (code === 'ACCOMMODATION_NOT_FOUND') {
      return new BadRequestException(code);
    }
    return error;
  }

  async findAll(user: AuthUser, query: ListHotelsQueryDto) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      HOTEL_SORT_FIELDS,
      'name',
      'asc',
    );
    const roomTypeWhere = query.roomType
      ? await this.roomTypeWhere(scope, query.roomType)
      : undefined;

    const where: Prisma.HotelWhereInput = {
      ...scope,
      ...(query.city && { city: query.city }),
      ...(query.region && { region: query.region }),
      ...(query.category && { category: query.category }),
      ...(query.stars !== undefined && { stars: query.stars }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.createdById && { createdById: query.createdById }),
      ...roomTypeWhere,
      ...(query.hasListing !== undefined && {
        accommodationId: query.hasListing ? { not: null } : null,
      }),
      ...(query.hasCommission !== undefined &&
        (query.hasCommission
          ? { NOT: { commissionRate: null } }
          : { commissionRate: null })),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        priceFrom: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { region: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          {
            contacts: {
              some: {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { phone: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: HOTEL_SELECT,
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.format(row)),
      meta: buildMeta(total, page, limit),
    };
  }

  /**
   * The room-type filter. A custom name matches each spelling stored within
   * the scope ("Sea view", "sea view"), as the filter list shows them as one.
   */
  private async roomTypeWhere(scope: Prisma.HotelWhereInput, value: string) {
    if (toRoomType(value)) return hotelRoomTypeWhere(value);
    const rows = await this.prisma.hotel.findMany({
      where: { ...scope, customRoomTypes: { isEmpty: false } },
      select: { customRoomTypes: true },
    });
    return hotelRoomTypeWhere(
      value,
      customRoomTypeSpellings(
        value,
        rows.map((row) => row.customRoomTypes),
      ),
    );
  }

  /**
   * Distinct cities, regions and custom room types inside the user's scope,
   * for the filter bar.
   */
  async filterOptions(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const [cities, regions, customLists] = await Promise.all([
      this.prisma.hotel.findMany({
        where: scope,
        distinct: ['city'],
        orderBy: { city: 'asc' },
        take: 500,
        select: { city: true },
      }),
      this.prisma.hotel.findMany({
        where: { ...scope, NOT: { region: null } },
        distinct: ['region'],
        orderBy: { region: 'asc' },
        take: 500,
        select: { region: true },
      }),
      this.prisma.hotel.findMany({
        where: { ...scope, customRoomTypes: { isEmpty: false } },
        // Oldest first, so the spelling shown for a name stays the same
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { customRoomTypes: true },
      }),
    ]);

    return {
      data: {
        cities: cities.map((row) => row.city),
        regions: regions
          .map((row) => row.region)
          .filter((region): region is string => !!region),
        customRoomTypes: collectCustomRoomTypes(
          customLists.map((row) => row.customRoomTypes),
        ),
      },
    };
  }

  /** Minimal list for pickers (hotel bookings, expenses…). */
  async options(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view');
    const rows = await this.prisma.hotel.findMany({
      where: { isActive: true, ...(scope ?? {}) },
      orderBy: [{ name: 'asc' }],
      take: 500,
      select: {
        id: true,
        name: true,
        city: true,
        commissionRate: true,
        priceFrom: true,
        priceCurrency: true,
        roomTypes: true,
        customRoomTypes: true,
      },
    });
    return {
      data: rows.map((row) => ({
        ...row,
        commissionRate:
          row.commissionRate !== null ? Number(row.commissionRate) : null,
        priceFrom: row.priceFrom !== null ? Number(row.priceFrom) : null,
      })),
    };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.hotel.findUnique({
      where: { id },
      select: HOTEL_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', row.createdById);
    return this.format(row);
  }

  async create(user: AuthUser, dto: CreateHotelDto) {
    const contacts = this.prepareContacts(dto.contacts);
    const roomTypeFields = mergeHotelRoomTypes(dto);
    await this.assertListingFree(dto.accommodationId);

    try {
      const row = await this.prisma.hotel.create({
        data: {
          name: dto.name,
          city: dto.city,
          region: dto.region ?? null,
          address: dto.address ?? null,
          stars: dto.stars ?? null,
          category: dto.category ?? 'STANDARD',
          priceFrom:
            dto.priceFrom !== undefined && dto.priceFrom !== null
              ? new Prisma.Decimal(dto.priceFrom)
              : null,
          priceCurrency: dto.priceCurrency ?? null,
          website: dto.website ?? null,
          commissionRate:
            dto.commissionRate !== undefined && dto.commissionRate !== null
              ? new Prisma.Decimal(dto.commissionRate)
              : null,
          notes: dto.notes ?? null,
          isActive: dto.isActive ?? true,
          ...roomTypeFields,
          accommodationId: dto.accommodationId ?? null,
          createdById: this.access.resolveOwnerId(
            user,
            MODULE,
            'create',
            dto.createdById,
          ),
          ...(contacts?.length && { contacts: { create: contacts } }),
        },
        select: HOTEL_SELECT,
      });
      return this.format(row);
    } catch (error) {
      throw this.mapListingError(error);
    }
  }

  async update(user: AuthUser, id: string, dto: UpdateHotelDto) {
    const existing = await this.prisma.hotel.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        roomTypes: true,
        customRoomTypes: true,
      },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    // Validate before touching anything, so a bad contact can't wipe the list
    const contacts = this.prepareContacts(dto.contacts);
    const roomTypeFields = mergeHotelRoomTypes(dto, existing);
    await this.assertListingFree(dto.accommodationId, id);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (contacts !== undefined) {
          await tx.hotelContact.deleteMany({ where: { hotelId: id } });
          if (contacts.length) {
            await tx.hotelContact.createMany({
              data: contacts.map((contact) => ({ ...contact, hotelId: id })),
            });
          }
        }

        return tx.hotel.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.city !== undefined && { city: dto.city }),
            ...(dto.region !== undefined && { region: dto.region }),
            ...(dto.address !== undefined && { address: dto.address }),
            ...(dto.stars !== undefined && { stars: dto.stars }),
            ...(dto.category !== undefined && { category: dto.category }),
            ...(dto.priceFrom !== undefined && {
              priceFrom:
                dto.priceFrom === null
                  ? null
                  : new Prisma.Decimal(dto.priceFrom),
            }),
            ...(dto.priceCurrency !== undefined && {
              priceCurrency: dto.priceCurrency,
            }),
            ...(dto.website !== undefined && { website: dto.website }),
            ...(dto.commissionRate !== undefined && {
              commissionRate:
                dto.commissionRate === null
                  ? null
                  : new Prisma.Decimal(dto.commissionRate),
            }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...roomTypeFields,
            ...(dto.accommodationId !== undefined && {
              accommodationId: dto.accommodationId,
            }),
            ...(dto.createdById !== undefined &&
              this.access.canAll(user, MODULE, 'edit') && {
                createdById: dto.createdById,
              }),
          },
          select: HOTEL_SELECT,
        });
      });
      return this.format(row);
    } catch (error) {
      throw this.mapListingError(error);
    }
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.hotel.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      MODULE,
      'delete',
      existing.createdById,
    );

    // Contacts are removed with the hotel (cascade).
    await this.prisma.hotel.delete({ where: { id } });
  }
}
