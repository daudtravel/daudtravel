import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency, PermissionModule, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import { CurrencyService } from '@/currency/currency.service';
import type { AuthUser } from '@/access/access.types';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  formatDateOnly,
  parseDateOnly,
  parseOptionalDateOnly,
} from '@/common/utils/date-only.util';
import { money } from '@/bookings/booking-totals';
import {
  CATALOG_SORT_FIELDS,
  CreateCatalogItemDto,
  ListCatalogQueryDto,
  UpdateCatalogItemDto,
} from './dto/catalog.dto';

const MODULE = PermissionModule.CATALOG;

const CATALOG_SELECT = {
  id: true,
  name: true,
  category: true,
  description: true,
  unit: true,
  price: true,
  cost: true,
  currency: true,
  vehicleType: true,
  city: true,
  season: true,
  validFrom: true,
  validTo: true,
  isActive: true,
  sortOrder: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.CatalogItemSelect;

type CatalogRow = Prisma.CatalogItemGetPayload<{
  select: typeof CATALOG_SELECT;
}>;

/** GEL per unit of every currency, plus the one the list is shown in. */
interface Conversion {
  currency: Currency;
  displayRate: Prisma.Decimal;
  rates: Map<Currency, Prisma.Decimal>;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly currency: CurrencyService,
  ) {}

  private format(row: CatalogRow, conversion?: Conversion) {
    const price = new Prisma.Decimal(row.price);
    return {
      ...row,
      price: Number(price),
      cost: row.cost !== null ? Number(row.cost) : null,
      validFrom: formatDateOnly(row.validFrom),
      validTo: formatDateOnly(row.validTo),
      margin: row.cost !== null ? Number(money(price.sub(row.cost))) : null,
      /** The same price in the currency the list is being shown in. */
      converted: conversion
        ? Number(
            money(
              price
                .mul(
                  conversion.rates.get(row.currency) ?? new Prisma.Decimal(1),
                )
                .div(conversion.displayRate),
            ),
          )
        : null,
      convertedCurrency: conversion?.currency ?? null,
    };
  }

  /** Rates used to show one price list in a single currency. */
  private async ratesFor(display?: Currency): Promise<Conversion | undefined> {
    if (!display) return undefined;
    const rates = new Map<Currency, Prisma.Decimal>();
    for (const code of Object.values(Currency)) {
      rates.set(code, await this.currency.getRate(code));
    }
    return {
      currency: display,
      displayRate: rates.get(display) ?? new Prisma.Decimal(1),
      rates,
    };
  }

  async findAll(
    user: AuthUser,
    query: ListCatalogQueryDto,
    displayCurrency?: Currency,
  ) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      CATALOG_SORT_FIELDS,
      'sortOrder',
      'asc',
    );

    const validOn = query.validOn
      ? parseDateOnly(query.validOn, 'validOn')
      : undefined;

    const where: Prisma.CatalogItemWhereInput = {
      ...scope,
      ...(query.category && { category: query.category }),
      ...(query.unit && { unit: query.unit }),
      ...(query.season && { season: query.season }),
      ...(query.vehicleType && { vehicleType: query.vehicleType }),
      ...(query.currency && { currency: query.currency }),
      ...(query.city && { city: query.city }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.createdById && { createdById: query.createdById }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      // A price with no dates is always valid
      ...(validOn && {
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: validOn } }] },
          { OR: [{ validTo: null }, { validTo: { gte: validOn } }] },
        ],
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const conversion = await this.ratesFor(displayCurrency);

    const [rows, total] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { name: 'asc' }],
        select: CATALOG_SELECT,
      }),
      this.prisma.catalogItem.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.format(row, conversion)),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Distinct cities, for the filter bar. */
  async filterOptions(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const rows = await this.prisma.catalogItem.findMany({
      where: { ...scope, NOT: { city: null } },
      distinct: ['city'],
      orderBy: { city: 'asc' },
      take: 500,
      select: { city: true },
    });
    return {
      data: {
        cities: rows
          .map((row) => row.city)
          .filter((city): city is string => !!city),
      },
    };
  }

  /** Active prices for the "pick from catalog" button in bookings. */
  async options(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view');
    const rows = await this.prisma.catalogItem.findMany({
      where: { isActive: true, ...(scope ?? {}) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      take: 500,
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        price: true,
        cost: true,
        currency: true,
      },
    });
    return {
      data: rows.map((row) => ({
        ...row,
        price: Number(row.price),
        cost: row.cost !== null ? Number(row.cost) : null,
      })),
    };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.catalogItem.findUnique({
      where: { id },
      select: CATALOG_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', row.createdById);
    return this.format(row);
  }

  private dates(dto: CreateCatalogItemDto | UpdateCatalogItemDto) {
    const validFrom = parseOptionalDateOnly(dto.validFrom, 'validFrom');
    const validTo = parseOptionalDateOnly(dto.validTo, 'validTo');
    if (validFrom && validTo && validFrom > validTo) {
      throw new BadRequestException('INVALID_DATE_RANGE');
    }
    return { validFrom, validTo };
  }

  async create(user: AuthUser, dto: CreateCatalogItemDto) {
    const { validFrom, validTo } = this.dates(dto);

    const row = await this.prisma.catalogItem.create({
      data: {
        name: dto.name,
        category: dto.category ?? 'OTHER',
        description: dto.description ?? null,
        unit: dto.unit ?? 'PER_PERSON',
        price: money(dto.price),
        cost:
          dto.cost !== undefined && dto.cost !== null ? money(dto.cost) : null,
        currency: dto.currency ?? Currency.GEL,
        vehicleType: dto.vehicleType ?? null,
        city: dto.city ?? null,
        season: dto.season ?? 'ALL_YEAR',
        validFrom,
        validTo,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: CATALOG_SELECT,
    });

    return this.format(row);
  }

  async update(user: AuthUser, id: string, dto: UpdateCatalogItemDto) {
    const existing = await this.prisma.catalogItem.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    const { validFrom, validTo } = this.dates(dto);

    const row = await this.prisma.catalogItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.price !== undefined && { price: money(dto.price) }),
        ...(dto.cost !== undefined && {
          cost: dto.cost === null ? null : money(dto.cost),
        }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.season !== undefined && { season: dto.season }),
        ...(dto.validFrom !== undefined && { validFrom }),
        ...(dto.validTo !== undefined && { validTo }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
      },
      select: CATALOG_SELECT,
    });

    return this.format(row);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.catalogItem.findUnique({
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

    await this.prisma.catalogItem.delete({ where: { id } });
  }
}
