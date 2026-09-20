import {
  BadRequestException,
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
  CreateHotelDto,
  HOTEL_SORT_FIELDS,
  HotelContactDto,
  ListHotelsQueryDto,
  UpdateHotelDto,
} from './dto/hotels.dto';

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
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
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

    const where: Prisma.HotelWhereInput = {
      ...scope,
      ...(query.city && { city: query.city }),
      ...(query.region && { region: query.region }),
      ...(query.category && { category: query.category }),
      ...(query.stars !== undefined && { stars: query.stars }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.createdById && { createdById: query.createdById }),
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

  /** Distinct cities and regions inside the user's scope, for the filter bar. */
  async filterOptions(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const [cities, regions] = await Promise.all([
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
    ]);

    return {
      data: {
        cities: cities.map((row) => row.city),
        regions: regions
          .map((row) => row.region)
          .filter((region): region is string => !!region),
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
  }

  async update(user: AuthUser, id: string, dto: UpdateHotelDto) {
    const existing = await this.prisma.hotel.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    // Validate before touching anything, so a bad contact can't wipe the list
    const contacts = this.prepareContacts(dto.contacts);

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
              dto.priceFrom === null ? null : new Prisma.Decimal(dto.priceFrom),
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
          ...(dto.createdById !== undefined &&
            this.access.canAll(user, MODULE, 'edit') && {
              createdById: dto.createdById,
            }),
        },
        select: HOTEL_SELECT,
      });
    });

    return this.format(row);
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
