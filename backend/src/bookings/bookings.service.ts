import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingItemType,
  BookingStatus,
  BookingType,
  Currency,
  PermissionModule,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import { CurrencyService } from '@/currency/currency.service';
import type { AuthUser, PermissionAction } from '@/access/access.types';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  formatDateOnly,
  parseDateOnly,
  parseDateRange,
  parseOptionalDateOnly,
} from '@/common/utils/date-only.util';
import { computeTotals, money } from './booking-totals';
import {
  BOOKING_SORT_FIELDS,
  BookingCommissionDto,
  BookingItemDto,
  CreateBookingDto,
  DraftFromOrderQueryDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
} from './dto/bookings.dto';

/** Which permission module covers which kind of booking. */
const MODULE_BY_TYPE: Record<BookingType, PermissionModule> = {
  [BookingType.HOTEL]: PermissionModule.BOOKINGS_HOTEL,
  [BookingType.TOUR]: PermissionModule.BOOKINGS_TOUR,
  [BookingType.TRANSFER]: PermissionModule.BOOKINGS_TOUR,
  [BookingType.PACKAGE]: PermissionModule.BOOKINGS_PACKAGE,
};

export const BOOKING_MODULES = [
  PermissionModule.BOOKINGS_HOTEL,
  PermissionModule.BOOKINGS_TOUR,
  PermissionModule.BOOKINGS_PACKAGE,
];

/** Lines that make sense for each kind of booking. */
const ALLOWED_ITEM_TYPES: Record<BookingType, BookingItemType[]> = {
  [BookingType.HOTEL]: [
    BookingItemType.HOTEL,
    BookingItemType.INSURANCE,
    BookingItemType.SIM_CARD,
    BookingItemType.OTHER,
  ],
  [BookingType.TOUR]: [
    BookingItemType.TOUR,
    BookingItemType.VEHICLE,
    BookingItemType.GUIDE,
    BookingItemType.INSURANCE,
    BookingItemType.SIM_CARD,
    BookingItemType.OTHER,
  ],
  [BookingType.TRANSFER]: [
    BookingItemType.TRANSFER,
    BookingItemType.VEHICLE,
    BookingItemType.OTHER,
  ],
  // A package is exactly the mix the brief describes: hotel + car + extras
  [BookingType.PACKAGE]: Object.values(BookingItemType),
};

const ITEM_SELECT = {
  id: true,
  type: true,
  title: true,
  hotelId: true,
  roomNumber: true,
  roomType: true,
  checkIn: true,
  checkOut: true,
  tourId: true,
  driverId: true,
  vehicleId: true,
  serviceDate: true,
  salePrice: true,
  costPrice: true,
  supplierPaid: true,
  supplierPaidAt: true,
  notes: true,
  sortOrder: true,
  hotel: { select: { id: true, name: true, city: true } },
  driver: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  vehicle: {
    select: { id: true, brand: true, model: true, year: true, type: true },
  },
  tour: { select: { id: true } },
} satisfies Prisma.BookingItemSelect;

const COMMISSION_SELECT = {
  id: true,
  partnerId: true,
  recipientName: true,
  kind: true,
  driverId: true,
  rate: true,
  amount: true,
  paid: true,
  paidAt: true,
  note: true,
  partner: { select: { id: true, name: true } },
  driver: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.BookingCommissionSelect;

const BOOKING_SELECT = {
  id: true,
  number: true,
  type: true,
  status: true,
  touristName: true,
  touristPhone: true,
  touristEmail: true,
  touristCountry: true,
  adults: true,
  children: true,
  startDate: true,
  endDate: true,
  currency: true,
  fxRate: true,
  totalPrice: true,
  totalCost: true,
  totalCommission: true,
  paidAmount: true,
  balanceDue: true,
  paymentMethod: true,
  referrerId: true,
  tourOrderId: true,
  transferOrderId: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  referrer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  // Ties are broken by id so the order never changes between two reads
  items: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    select: ITEM_SELECT,
  },
  commissions: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: COMMISSION_SELECT,
  },
} satisfies Prisma.BookingSelect;

type BookingRow = Prisma.BookingGetPayload<{ select: typeof BOOKING_SELECT }>;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly currency: CurrencyService,
  ) {}

  // ---------------------------------------------------------------- helpers

  private moduleFor(type: BookingType) {
    return MODULE_BY_TYPE[type];
  }

  private format(row: BookingRow) {
    const profit = money(
      new Prisma.Decimal(row.totalPrice)
        .sub(row.totalCost)
        .sub(row.totalCommission),
    );
    return {
      ...row,
      startDate: formatDateOnly(row.startDate),
      endDate: formatDateOnly(row.endDate),
      fxRate: Number(row.fxRate),
      totalPrice: Number(row.totalPrice),
      totalCost: Number(row.totalCost),
      totalCommission: Number(row.totalCommission),
      paidAmount: Number(row.paidAmount),
      balanceDue: Number(row.balanceDue),
      profit: Number(profit),
      source: row.tourOrderId || row.transferOrderId ? 'website' : 'manual',
      items: row.items.map((item) => ({
        ...item,
        checkIn: formatDateOnly(item.checkIn),
        checkOut: formatDateOnly(item.checkOut),
        serviceDate: formatDateOnly(item.serviceDate),
        salePrice: Number(item.salePrice),
        costPrice: Number(item.costPrice),
        profit: Number(
          money(new Prisma.Decimal(item.salePrice).sub(item.costPrice)),
        ),
      })),
      commissions: row.commissions.map((commission) => ({
        ...commission,
        rate: commission.rate !== null ? Number(commission.rate) : null,
        amount: Number(commission.amount),
      })),
    };
  }

  /** Types the user may act on, with the record scope of each. */
  private typeFilters(
    user: AuthUser,
    action: PermissionAction,
  ): Prisma.BookingWhereInput[] {
    const filters: Prisma.BookingWhereInput[] = [];
    for (const type of Object.values(BookingType)) {
      const scope = this.access.scopeWhere(user, this.moduleFor(type), action);
      if (scope) filters.push({ type, ...scope });
    }
    return filters;
  }

  private assertCanCreate(user: AuthUser, type: BookingType) {
    if (!this.access.can(user, this.moduleFor(type), 'create')) {
      throw new ForbiddenException('FORBIDDEN');
    }
  }

  /** Loads a booking the user may act on, or 404 (never reveals it exists). */
  private async loadForAction(
    user: AuthUser,
    id: string,
    action: PermissionAction,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        status: true,
        currency: true,
        startDate: true,
        createdById: true,
      },
    });
    if (!booking) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      this.moduleFor(booking.type),
      action,
      booking.createdById,
    );
    return booking;
  }

  private validateItemTypes(type: BookingType, items: BookingItemDto[]) {
    const allowed = ALLOWED_ITEM_TYPES[type];
    for (const item of items) {
      if (!allowed.includes(item.type)) {
        throw new BadRequestException('ITEM_TYPE_NOT_ALLOWED');
      }
    }
  }

  /** Every hotel/driver/vehicle/tour/partner referenced must exist. */
  private async assertReferencesExist(
    items: BookingItemDto[],
    commissions: BookingCommissionDto[],
    referrerId?: string | null,
  ) {
    const hotelIds = [...new Set(items.map((i) => i.hotelId).filter(Boolean))];
    const tourIds = [...new Set(items.map((i) => i.tourId).filter(Boolean))];
    const vehicleIds = [
      ...new Set(items.map((i) => i.vehicleId).filter(Boolean)),
    ];
    const driverIds = [
      ...new Set(
        [
          ...items.map((i) => i.driverId),
          ...commissions.map((c) => c.driverId),
        ].filter(Boolean),
      ),
    ];
    const partnerIds = [
      ...new Set(
        [referrerId, ...commissions.map((c) => c.partnerId)].filter(Boolean),
      ),
    ];

    const [hotels, tours, vehicles, drivers, partners] = await Promise.all([
      hotelIds.length
        ? this.prisma.hotel.count({
            where: { id: { in: hotelIds as string[] } },
          })
        : 0,
      tourIds.length
        ? this.prisma.tour.count({ where: { id: { in: tourIds as string[] } } })
        : 0,
      vehicleIds.length
        ? this.prisma.vehicle.count({
            where: { id: { in: vehicleIds as string[] } },
          })
        : 0,
      driverIds.length
        ? this.prisma.driver.count({
            where: { id: { in: driverIds as string[] } },
          })
        : 0,
      partnerIds.length
        ? this.prisma.partner.count({
            where: { id: { in: partnerIds as string[] } },
          })
        : 0,
    ]);

    if (hotels !== hotelIds.length) {
      throw new BadRequestException('HOTEL_NOT_FOUND');
    }
    if (tours !== tourIds.length)
      throw new BadRequestException('TOUR_NOT_FOUND');
    if (vehicles !== vehicleIds.length) {
      throw new BadRequestException('VEHICLE_NOT_FOUND');
    }
    if (drivers !== driverIds.length) {
      throw new BadRequestException('DRIVER_NOT_FOUND');
    }
    if (partners !== partnerIds.length) {
      throw new BadRequestException('PARTNER_NOT_FOUND');
    }
  }

  /** Names kept on the commission even if the partner is deleted later. */
  private async recipientNames(commissions: BookingCommissionDto[]) {
    const ids = [
      ...new Set(commissions.map((c) => c.partnerId).filter(Boolean)),
    ] as string[];
    if (!ids.length) return new Map<string, string>();
    const partners = await this.prisma.partner.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(partners.map((p) => [p.id, p.name]));
  }

  private async assertOrderLink(
    tourOrderId: string | null | undefined,
    transferOrderId: string | null | undefined,
    bookingId?: string,
  ) {
    for (const [field, value] of [
      ['tourOrderId', tourOrderId],
      ['transferOrderId', transferOrderId],
    ] as const) {
      if (!value) continue;
      const existing = await this.prisma.booking.findFirst({
        where: { [field]: value, ...(bookingId && { NOT: { id: bookingId } }) },
        select: { id: true, number: true },
      });
      if (existing) {
        throw new ConflictException({
          message: 'ORDER_ALREADY_BOOKED',
          booking: existing,
        });
      }
    }
  }

  private itemData(item: BookingItemDto, index: number) {
    return {
      type: item.type,
      title: item.title,
      hotelId: item.hotelId ?? null,
      roomNumber: item.roomNumber ?? null,
      roomType: item.roomType ?? null,
      checkIn: parseOptionalDateOnly(item.checkIn, 'checkIn'),
      checkOut: parseOptionalDateOnly(item.checkOut, 'checkOut'),
      tourId: item.tourId ?? null,
      driverId: item.driverId ?? null,
      vehicleId: item.vehicleId ?? null,
      serviceDate: parseOptionalDateOnly(item.serviceDate, 'serviceDate'),
      salePrice: money(item.salePrice ?? 0),
      costPrice: money(item.costPrice ?? 0),
      supplierPaid: item.supplierPaid ?? false,
      supplierPaidAt: item.supplierPaid ? new Date() : null,
      notes: item.notes ?? null,
      sortOrder: item.sortOrder ?? index,
    };
  }

  // ------------------------------------------------------------------ list

  async findAll(user: AuthUser, query: ListBookingsQueryDto) {
    const allowed = this.typeFilters(user, 'view');
    if (!allowed.length) {
      const { page, limit } = resolvePagination(query.page, query.limit);
      return { data: [], meta: buildMeta(0, page, limit) };
    }

    const where = this.buildWhere(allowed, query);
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      BOOKING_SORT_FIELDS,
      'startDate',
      'desc',
    );

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: BOOKING_SELECT,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.format(row)),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Totals for the current filters, per currency (money is never mixed). */
  async summary(user: AuthUser, query: ListBookingsQueryDto) {
    const allowed = this.typeFilters(user, 'view');
    if (!allowed.length) return { data: [] };

    const where = this.buildWhere(allowed, query);
    const grouped = await this.prisma.booking.groupBy({
      by: ['currency'],
      where,
      _count: { _all: true },
      _sum: {
        totalPrice: true,
        totalCost: true,
        totalCommission: true,
        paidAmount: true,
        balanceDue: true,
      },
    });

    return {
      data: grouped.map((group) => {
        const totalPrice = new Prisma.Decimal(group._sum.totalPrice ?? 0);
        const totalCost = new Prisma.Decimal(group._sum.totalCost ?? 0);
        const totalCommission = new Prisma.Decimal(
          group._sum.totalCommission ?? 0,
        );
        return {
          currency: group.currency,
          count: group._count._all,
          totalPrice: Number(totalPrice),
          totalCost: Number(totalCost),
          totalCommission: Number(totalCommission),
          paidAmount: Number(group._sum.paidAmount ?? 0),
          balanceDue: Number(group._sum.balanceDue ?? 0),
          profit: Number(money(totalPrice.sub(totalCost).sub(totalCommission))),
        };
      }),
    };
  }

  private buildWhere(
    allowed: Prisma.BookingWhereInput[],
    query: ListBookingsQueryDto,
  ): Prisma.BookingWhereInput {
    const and: Prisma.BookingWhereInput[] = [{ OR: allowed }];

    if (query.type) and.push({ type: query.type });
    if (query.status) and.push({ status: query.status });
    if (query.currency) and.push({ currency: query.currency });
    if (query.referrerId) and.push({ referrerId: query.referrerId });
    if (query.createdById) and.push({ createdById: query.createdById });

    const startRange = parseDateRange(query.dateFrom, query.dateTo);
    if (startRange) and.push({ startDate: startRange });
    const createdRange = parseDateRange(query.createdFrom, query.createdTo);
    if (createdRange) and.push({ createdAt: createdRange });

    if (query.paymentState === 'unpaid') and.push({ paidAmount: { lte: 0 } });
    if (query.paymentState === 'partial') {
      and.push({ paidAmount: { gt: 0 } }, { balanceDue: { gt: 0 } });
    }
    if (query.paymentState === 'paid') and.push({ balanceDue: { lte: 0 } });
    if (query.hasBalance !== undefined) {
      and.push(
        query.hasBalance
          ? { balanceDue: { gt: 0 } }
          : { balanceDue: { lte: 0 } },
      );
    }

    if (query.source === 'website') {
      and.push({
        OR: [
          { NOT: { tourOrderId: null } },
          { NOT: { transferOrderId: null } },
        ],
      });
    }
    if (query.source === 'manual') {
      and.push({ tourOrderId: null, transferOrderId: null });
    }

    const itemFilters: Prisma.BookingItemWhereInput = {
      ...(query.hotelId && { hotelId: query.hotelId }),
      ...(query.driverId && { driverId: query.driverId }),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(query.tourId && { tourId: query.tourId }),
    };
    if (Object.keys(itemFilters).length) {
      and.push({ items: { some: itemFilters } });
    }

    if (query.search) {
      const search = query.search;
      const asNumber = Number(search.replace(/^BK-?/i, ''));
      and.push({
        OR: [
          { touristName: { contains: search, mode: 'insensitive' } },
          { touristPhone: { contains: search, mode: 'insensitive' } },
          { touristEmail: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: { title: { contains: search, mode: 'insensitive' } },
            },
          },
          ...(Number.isInteger(asNumber) && asNumber > 0
            ? [{ number: asNumber }]
            : []),
        ],
      });
    }

    return { AND: and };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      select: BOOKING_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      this.moduleFor(row.type),
      'view',
      row.createdById,
    );
    return this.format(row);
  }

  // ----------------------------------------------------------------- write

  async create(user: AuthUser, dto: CreateBookingDto) {
    this.assertCanCreate(user, dto.type);

    const items = dto.items ?? [];
    const commissions = dto.commissions ?? [];
    this.validateItemTypes(dto.type, items);
    await this.assertReferencesExist(items, commissions, dto.referrerId);
    await this.assertOrderLink(dto.tourOrderId, dto.transferOrderId);

    const startDate = parseDateOnly(dto.startDate, 'startDate');
    const endDate = parseOptionalDateOnly(dto.endDate, 'endDate');
    if (endDate && endDate < startDate) {
      throw new BadRequestException('INVALID_DATE_RANGE');
    }

    const currency = dto.currency ?? Currency.GEL;
    const fxRate = await this.currency.getRate(currency, startDate);
    const totals = computeTotals(
      items.map((item) => ({
        driverId: item.driverId,
        salePrice: item.salePrice ?? 0,
        costPrice: item.costPrice ?? 0,
      })),
      commissions,
    );
    const names = await this.recipientNames(commissions);
    const paidAmount = money(dto.paidAmount ?? 0);

    const booking = await this.prisma.booking.create({
      data: {
        type: dto.type,
        status: dto.status ?? BookingStatus.PENDING,
        touristName: dto.touristName,
        touristPhone: dto.touristPhone ?? null,
        touristEmail: dto.touristEmail ?? null,
        touristCountry: dto.touristCountry ?? null,
        adults: dto.adults ?? 1,
        children: dto.children ?? 0,
        startDate,
        endDate,
        currency,
        fxRate,
        totalPrice: totals.totalPrice,
        totalCost: totals.totalCost,
        totalCommission: totals.totalCommission,
        paidAmount,
        balanceDue: money(totals.totalPrice.sub(paidAmount)),
        paymentMethod: dto.paymentMethod ?? null,
        referrerId: dto.referrerId ?? null,
        tourOrderId: dto.tourOrderId ?? null,
        transferOrderId: dto.transferOrderId ?? null,
        notes: dto.notes ?? null,
        createdById: this.access.resolveOwnerId(
          user,
          this.moduleFor(dto.type),
          'create',
          dto.createdById,
        ),
        items: {
          create: items.map((item, index) => this.itemData(item, index)),
        },
        commissions: {
          create: commissions.map((commission, index) => ({
            partnerId: commission.partnerId ?? null,
            recipientName:
              commission.recipientName ??
              (commission.partnerId ? names.get(commission.partnerId) : null) ??
              '—',
            kind: commission.kind,
            driverId: commission.driverId ?? null,
            rate:
              commission.rate !== undefined && commission.rate !== null
                ? new Prisma.Decimal(commission.rate)
                : null,
            amount: totals.commissionAmounts[index],
            paid: commission.paid ?? false,
            paidAt: commission.paid ? new Date() : null,
            note: commission.note ?? null,
          })),
        },
      },
      select: BOOKING_SELECT,
    });

    return this.format(booking);
  }

  async update(user: AuthUser, id: string, dto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        createdById: true,
        currency: true,
        startDate: true,
        paidAmount: true,
        tourOrderId: true,
        transferOrderId: true,
      },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      this.moduleFor(existing.type),
      'edit',
      existing.createdById,
    );

    const type = dto.type ?? existing.type;
    // Moving a booking between sections needs the rights to both
    if (type !== existing.type) {
      this.access.assertRecordAccess(
        user,
        this.moduleFor(type),
        'edit',
        existing.createdById,
      );
    }

    const items = dto.items;
    const commissions = dto.commissions;
    if (items) this.validateItemTypes(type, items);
    await this.assertReferencesExist(
      items ?? [],
      commissions ?? [],
      dto.referrerId,
    );
    await this.assertOrderLink(dto.tourOrderId, dto.transferOrderId, id);

    const startDate = dto.startDate
      ? parseDateOnly(dto.startDate, 'startDate')
      : existing.startDate;
    const endDate =
      dto.endDate !== undefined
        ? parseOptionalDateOnly(dto.endDate, 'endDate')
        : undefined;
    if (endDate && endDate < startDate) {
      throw new BadRequestException('INVALID_DATE_RANGE');
    }

    const currency = dto.currency ?? existing.currency;
    // Re-snapshot the rate when the money or the date changed
    const fxRate =
      currency !== existing.currency ||
      startDate.getTime() !== existing.startDate.getTime()
        ? await this.currency.getRate(currency, startDate)
        : undefined;

    const names = commissions
      ? await this.recipientNames(commissions)
      : new Map<string, string>();

    const updated = await this.prisma.$transaction(async (tx) => {
      if (items) {
        const keepIds = items
          .map((item) => item.id)
          .filter((itemId): itemId is string => !!itemId);
        await tx.bookingItem.deleteMany({
          where: {
            bookingId: id,
            ...(keepIds.length && { id: { notIn: keepIds } }),
          },
        });
        for (const [index, item] of items.entries()) {
          const data = this.itemData(item, index);
          if (item.id) {
            // Keep the moment the supplier was paid if it did not change
            const current = await tx.bookingItem.findFirst({
              where: { id: item.id, bookingId: id },
              select: { id: true, supplierPaid: true, supplierPaidAt: true },
            });
            if (!current) throw new BadRequestException('ITEM_NOT_FOUND');
            await tx.bookingItem.update({
              where: { id: item.id },
              data: {
                ...data,
                supplierPaidAt: data.supplierPaid
                  ? (current.supplierPaidAt ?? new Date())
                  : null,
              },
            });
          } else {
            await tx.bookingItem.create({ data: { ...data, bookingId: id } });
          }
        }
      }

      const finalItems = await tx.bookingItem.findMany({
        where: { bookingId: id },
        select: { driverId: true, salePrice: true, costPrice: true },
      });

      if (commissions) {
        const keepIds = commissions
          .map((commission) => commission.id)
          .filter((commissionId): commissionId is string => !!commissionId);
        await tx.bookingCommission.deleteMany({
          where: {
            bookingId: id,
            ...(keepIds.length && { id: { notIn: keepIds } }),
          },
        });
      }

      const finalCommissions = commissions
        ? commissions
        : (
            await tx.bookingCommission.findMany({
              where: { bookingId: id },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                partnerId: true,
                recipientName: true,
                kind: true,
                driverId: true,
                rate: true,
                amount: true,
                paid: true,
                note: true,
              },
            })
          ).map((row) => ({
            id: row.id,
            partnerId: row.partnerId,
            recipientName: row.recipientName,
            kind: row.kind,
            driverId: row.driverId,
            rate: row.rate !== null ? Number(row.rate) : null,
            amount: Number(row.amount),
            paid: row.paid,
            note: row.note,
          }));

      const totals = computeTotals(finalItems, finalCommissions);

      for (const [index, commission] of finalCommissions.entries()) {
        const data = {
          partnerId: commission.partnerId ?? null,
          recipientName:
            commission.recipientName ??
            (commission.partnerId ? names.get(commission.partnerId) : null) ??
            '—',
          kind: commission.kind,
          driverId: commission.driverId ?? null,
          rate:
            commission.rate !== undefined && commission.rate !== null
              ? new Prisma.Decimal(commission.rate)
              : null,
          amount: totals.commissionAmounts[index],
          paid: commission.paid ?? false,
          note: commission.note ?? null,
        };
        if (commission.id) {
          const current = await tx.bookingCommission.findFirst({
            where: { id: commission.id, bookingId: id },
            select: { id: true, paidAt: true },
          });
          if (!current) throw new BadRequestException('COMMISSION_NOT_FOUND');
          await tx.bookingCommission.update({
            where: { id: commission.id },
            data: {
              ...data,
              paidAt: data.paid ? (current.paidAt ?? new Date()) : null,
            },
          });
        } else {
          await tx.bookingCommission.create({
            data: {
              ...data,
              bookingId: id,
              paidAt: data.paid ? new Date() : null,
            },
          });
        }
      }

      const paidAmount =
        dto.paidAmount !== undefined && dto.paidAmount !== null
          ? money(dto.paidAmount)
          : new Prisma.Decimal(existing.paidAmount);

      return tx.booking.update({
        where: { id },
        data: {
          type,
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.touristName !== undefined && {
            touristName: dto.touristName,
          }),
          ...(dto.touristPhone !== undefined && {
            touristPhone: dto.touristPhone,
          }),
          ...(dto.touristEmail !== undefined && {
            touristEmail: dto.touristEmail,
          }),
          ...(dto.touristCountry !== undefined && {
            touristCountry: dto.touristCountry,
          }),
          ...(dto.adults !== undefined && { adults: dto.adults }),
          ...(dto.children !== undefined && { children: dto.children }),
          ...(dto.startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          currency,
          ...(fxRate && { fxRate }),
          totalPrice: totals.totalPrice,
          totalCost: totals.totalCost,
          totalCommission: totals.totalCommission,
          paidAmount,
          balanceDue: money(totals.totalPrice.sub(paidAmount)),
          ...(dto.paymentMethod !== undefined && {
            paymentMethod: dto.paymentMethod,
          }),
          ...(dto.referrerId !== undefined && { referrerId: dto.referrerId }),
          ...(dto.tourOrderId !== undefined && {
            tourOrderId: dto.tourOrderId,
          }),
          ...(dto.transferOrderId !== undefined && {
            transferOrderId: dto.transferOrderId,
          }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.createdById !== undefined &&
            this.access.canAll(user, this.moduleFor(type), 'edit') && {
              createdById: dto.createdById,
            }),
        },
        select: BOOKING_SELECT,
      });
    });

    return this.format(updated);
  }

  async changeStatus(user: AuthUser, id: string, status: BookingStatus) {
    await this.loadForAction(user, id, 'edit');
    const row = await this.prisma.booking.update({
      where: { id },
      data: { status },
      select: BOOKING_SELECT,
    });
    return this.format(row);
  }

  async setSupplierPaid(user: AuthUser, itemId: string, paid: boolean) {
    const item = await this.prisma.bookingItem.findUnique({
      where: { id: itemId },
      select: { id: true, bookingId: true },
    });
    if (!item) throw new NotFoundException('NOT_FOUND');
    await this.loadForAction(user, item.bookingId, 'edit');

    await this.prisma.bookingItem.update({
      where: { id: itemId },
      data: { supplierPaid: paid, supplierPaidAt: paid ? new Date() : null },
    });
    return this.findOne(user, item.bookingId);
  }

  async setCommissionPaid(user: AuthUser, commissionId: string, paid: boolean) {
    const commission = await this.prisma.bookingCommission.findUnique({
      where: { id: commissionId },
      select: { id: true, bookingId: true },
    });
    if (!commission) throw new NotFoundException('NOT_FOUND');
    await this.loadForAction(user, commission.bookingId, 'edit');

    await this.prisma.bookingCommission.update({
      where: { id: commissionId },
      data: { paid, paidAt: paid ? new Date() : null },
    });
    return this.findOne(user, commission.bookingId);
  }

  async remove(user: AuthUser, id: string) {
    await this.loadForAction(user, id, 'delete');
    // Items and commissions go with it (cascade)
    await this.prisma.booking.delete({ where: { id } });
  }

  // ------------------------------------------------- from a website order

  /**
   * Turns a paid website order into a booking draft (nothing is saved yet), so
   * the office can complete the costs and confirm it.
   */
  async draftFromOrder(user: AuthUser, query: DraftFromOrderQueryDto) {
    const type =
      query.type === 'TOUR' ? BookingType.TOUR : BookingType.TRANSFER;
    this.assertCanCreate(user, type);

    const linked = await this.prisma.booking.findFirst({
      where:
        query.type === 'TOUR'
          ? { tourOrderId: query.id }
          : { transferOrderId: query.id },
      select: { id: true, number: true },
    });
    if (linked) {
      throw new ConflictException({
        message: 'ORDER_ALREADY_BOOKED',
        booking: linked,
      });
    }

    if (query.type === 'TOUR') {
      const order = await this.prisma.tourPaymentOrder.findUnique({
        where: { id: query.id },
        select: {
          id: true,
          tourId: true,
          tourName: true,
          customerFirstName: true,
          customerLastName: true,
          customerEmail: true,
          customerPhone: true,
          peopleCount: true,
          selectedDate: true,
          totalPrice: true,
          paidAmount: true,
          status: true,
        },
      });
      if (!order) throw new NotFoundException('NOT_FOUND');
      if (order.status !== 'PAID') {
        throw new BadRequestException('ORDER_NOT_PAID');
      }

      return {
        data: {
          type,
          tourOrderId: order.id,
          touristName: `${order.customerFirstName} ${order.customerLastName}`,
          touristPhone: order.customerPhone,
          touristEmail: order.customerEmail,
          adults: order.peopleCount,
          children: 0,
          startDate: formatDateOnly(order.selectedDate),
          currency: Currency.GEL,
          paidAmount: Number(order.paidAmount),
          items: [
            {
              type: BookingItemType.TOUR,
              title: order.tourName,
              tourId: order.tourId,
              serviceDate: formatDateOnly(order.selectedDate),
              salePrice: Number(order.totalPrice),
              costPrice: 0,
            },
          ],
        },
      };
    }

    const order = await this.prisma.transferPaymentOrder.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        customerPhone: true,
        passengerCount: true,
        transferDate: true,
        transferStartLocation: true,
        transferEndLocation: true,
        paymentAmount: true,
        driverId: true,
        status: true,
      },
    });
    if (!order) throw new NotFoundException('NOT_FOUND');
    if (order.status !== 'PAID') {
      throw new BadRequestException('ORDER_NOT_PAID');
    }

    return {
      data: {
        type,
        transferOrderId: order.id,
        touristName: `${order.customerFirstName} ${order.customerLastName}`,
        touristPhone: order.customerPhone,
        touristEmail: order.customerEmail,
        adults: order.passengerCount,
        children: 0,
        startDate: formatDateOnly(order.transferDate),
        currency: Currency.GEL,
        paidAmount: Number(order.paymentAmount),
        items: [
          {
            type: BookingItemType.TRANSFER,
            title: `${order.transferStartLocation} → ${order.transferEndLocation}`,
            driverId: order.driverId,
            serviceDate: formatDateOnly(order.transferDate),
            salePrice: Number(order.paymentAmount),
            costPrice: 0,
          },
        ],
      },
    };
  }

  /** Bookings linked to website orders, so the order lists can show a badge. */
  async linkedOrders(user: AuthUser) {
    const allowed = this.typeFilters(user, 'view');
    if (!allowed.length)
      return { data: { tourOrders: {}, transferOrders: {} } };

    const rows = await this.prisma.booking.findMany({
      where: {
        AND: [
          { OR: allowed },
          {
            OR: [
              { NOT: { tourOrderId: null } },
              { NOT: { transferOrderId: null } },
            ],
          },
        ],
      },
      select: {
        id: true,
        number: true,
        tourOrderId: true,
        transferOrderId: true,
      },
      take: 2000,
    });

    const tourOrders: Record<string, { id: string; number: number }> = {};
    const transferOrders: Record<string, { id: string; number: number }> = {};
    for (const row of rows) {
      if (row.tourOrderId) {
        tourOrders[row.tourOrderId] = { id: row.id, number: row.number };
      }
      if (row.transferOrderId) {
        transferOrders[row.transferOrderId] = {
          id: row.id,
          number: row.number,
        };
      }
    }
    return { data: { tourOrders, transferOrders } };
  }
}
