import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Currency,
  PermissionModule,
  Prisma,
  TransactionCategory,
  TransactionType,
} from '@prisma/client';
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
  parseDateRange,
} from '@/common/utils/date-only.util';
import { money } from '@/bookings/booking-totals';
import {
  CreateTransactionDto,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ListTransactionsQueryDto,
  TRANSACTION_SORT_FIELDS,
  UpdateTransactionDto,
} from './dto/transactions.dto';

const MODULE = PermissionModule.TRANSACTIONS;

const TRANSACTION_SELECT = {
  id: true,
  type: true,
  category: true,
  date: true,
  amount: true,
  currency: true,
  fxRate: true,
  title: true,
  description: true,
  paymentMethod: true,
  vehicleId: true,
  driverId: true,
  hotelId: true,
  tourId: true,
  bookingId: true,
  employeeId: true,
  partnerId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  vehicle: { select: { id: true, brand: true, model: true, year: true } },
  driver: { select: { id: true, firstName: true, lastName: true } },
  hotel: { select: { id: true, name: true, city: true } },
  booking: { select: { id: true, number: true, touristName: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
  partner: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.TransactionSelect;

type TransactionRow = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_SELECT;
}>;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly currency: CurrencyService,
  ) {}

  private format(row: TransactionRow) {
    return {
      ...row,
      date: formatDateOnly(row.date),
      amount: Number(row.amount),
      fxRate: Number(row.fxRate),
      /** The same amount in the base currency, for mixed-currency totals. */
      amountGel: Number(money(new Prisma.Decimal(row.amount).mul(row.fxRate))),
    };
  }

  /** An office expense filed as income would quietly corrupt the report. */
  private assertCategoryMatchesType(
    type: TransactionType,
    category: TransactionCategory,
  ) {
    const allowed =
      type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!allowed.includes(category)) {
      throw new BadRequestException('CATEGORY_TYPE_MISMATCH');
    }
  }

  private async assertReferencesExist(
    dto: CreateTransactionDto | UpdateTransactionDto,
  ) {
    const checks: [string | null | undefined, () => Promise<number>, string][] =
      [
        [
          dto.vehicleId,
          () =>
            this.prisma.vehicle.count({
              where: { id: dto.vehicleId as string },
            }),
          'VEHICLE_NOT_FOUND',
        ],
        [
          dto.driverId,
          () =>
            this.prisma.driver.count({ where: { id: dto.driverId as string } }),
          'DRIVER_NOT_FOUND',
        ],
        [
          dto.hotelId,
          () =>
            this.prisma.hotel.count({ where: { id: dto.hotelId as string } }),
          'HOTEL_NOT_FOUND',
        ],
        [
          dto.tourId,
          () => this.prisma.tour.count({ where: { id: dto.tourId as string } }),
          'TOUR_NOT_FOUND',
        ],
        [
          dto.bookingId,
          () =>
            this.prisma.booking.count({
              where: { id: dto.bookingId as string },
            }),
          'BOOKING_NOT_FOUND',
        ],
        [
          dto.employeeId,
          () =>
            this.prisma.user.count({ where: { id: dto.employeeId as string } }),
          'USER_NOT_FOUND',
        ],
        [
          dto.partnerId,
          () =>
            this.prisma.partner.count({
              where: { id: dto.partnerId as string },
            }),
          'PARTNER_NOT_FOUND',
        ],
      ];

    for (const [value, count, error] of checks) {
      if (!value) continue;
      if ((await count()) === 0) throw new BadRequestException(error);
    }
  }

  private buildWhere(
    user: AuthUser,
    query: ListTransactionsQueryDto,
  ): Prisma.TransactionWhereInput {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const dateRange = parseDateRange(query.dateFrom, query.dateTo);

    return {
      ...scope,
      ...(query.type && { type: query.type }),
      ...(query.categories?.length && { category: { in: query.categories } }),
      ...(query.currency && { currency: query.currency }),
      ...(dateRange && { date: dateRange }),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(query.driverId && { driverId: query.driverId }),
      ...(query.hotelId && { hotelId: query.hotelId }),
      ...(query.tourId && { tourId: query.tourId }),
      ...(query.bookingId && { bookingId: query.bookingId }),
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.partnerId && { partnerId: query.partnerId }),
      ...(query.createdById && { createdById: query.createdById }),
      ...(query.paymentMethod && {
        paymentMethod: { contains: query.paymentMethod, mode: 'insensitive' },
      }),
      ...((query.minAmount !== undefined || query.maxAmount !== undefined) && {
        amount: {
          ...(query.minAmount !== undefined && { gte: query.minAmount }),
          ...(query.maxAmount !== undefined && { lte: query.maxAmount }),
        },
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { paymentMethod: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  async findAll(user: AuthUser, query: ListTransactionsQueryDto) {
    const where = this.buildWhere(user, query);
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      TRANSACTION_SORT_FIELDS,
      'date',
      'desc',
    );

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: TRANSACTION_SELECT,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.format(row)),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Totals for the current filters: per currency, plus a GEL grand total. */
  async summary(user: AuthUser, query: ListTransactionsQueryDto) {
    const where = this.buildWhere(user, query);

    const [grouped, byCategory] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['type', 'currency'],
        where,
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['category'],
        where,
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    // GEL equivalents need the stored rate of each row, so they are summed here
    const rows = await this.prisma.transaction.findMany({
      where,
      select: { type: true, amount: true, fxRate: true },
      take: 20000,
    });

    let incomeGel = new Prisma.Decimal(0);
    let expenseGel = new Prisma.Decimal(0);
    for (const row of rows) {
      const inGel = new Prisma.Decimal(row.amount).mul(row.fxRate);
      if (row.type === TransactionType.INCOME) {
        incomeGel = incomeGel.add(inGel);
      } else {
        expenseGel = expenseGel.add(inGel);
      }
    }

    return {
      data: {
        byCurrency: grouped.map((group) => ({
          type: group.type,
          currency: group.currency,
          count: group._count._all,
          amount: Number(group._sum.amount ?? 0),
        })),
        byCategory: byCategory
          .map((group) => ({
            category: group.category,
            count: group._count._all,
            amount: Number(group._sum.amount ?? 0),
          }))
          .sort((a, b) => b.amount - a.amount),
        totalsGel: {
          income: Number(money(incomeGel)),
          expense: Number(money(expenseGel)),
          net: Number(money(incomeGel.sub(expenseGel))),
        },
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      select: TRANSACTION_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', row.createdById);
    return this.format(row);
  }

  async create(user: AuthUser, dto: CreateTransactionDto) {
    this.assertCategoryMatchesType(dto.type, dto.category);
    await this.assertReferencesExist(dto);

    const date = parseDateOnly(dto.date, 'date');
    const currency = dto.currency ?? Currency.GEL;
    const fxRate = await this.currency.getRate(currency, date);

    const row = await this.prisma.transaction.create({
      data: {
        type: dto.type,
        category: dto.category,
        date,
        amount: money(dto.amount),
        currency,
        fxRate,
        title: dto.title,
        description: dto.description ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        vehicleId: dto.vehicleId ?? null,
        driverId: dto.driverId ?? null,
        hotelId: dto.hotelId ?? null,
        tourId: dto.tourId ?? null,
        bookingId: dto.bookingId ?? null,
        employeeId: dto.employeeId ?? null,
        partnerId: dto.partnerId ?? null,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: TRANSACTION_SELECT,
    });

    return this.format(row);
  }

  async update(user: AuthUser, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        category: true,
        date: true,
        currency: true,
        createdById: true,
      },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    const type = dto.type ?? existing.type;
    const category = dto.category ?? existing.category;
    this.assertCategoryMatchesType(type, category);
    await this.assertReferencesExist(dto);

    const date = dto.date ? parseDateOnly(dto.date, 'date') : existing.date;
    const currency = dto.currency ?? existing.currency;
    // Re-snapshot the rate when the money or the date changed
    const fxRate =
      currency !== existing.currency ||
      date.getTime() !== existing.date.getTime()
        ? await this.currency.getRate(currency, date)
        : undefined;

    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        type,
        category,
        date,
        currency,
        ...(fxRate && { fxRate }),
        ...(dto.amount !== undefined && { amount: money(dto.amount) }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.paymentMethod !== undefined && {
          paymentMethod: dto.paymentMethod,
        }),
        ...(dto.vehicleId !== undefined && { vehicleId: dto.vehicleId }),
        ...(dto.driverId !== undefined && { driverId: dto.driverId }),
        ...(dto.hotelId !== undefined && { hotelId: dto.hotelId }),
        ...(dto.tourId !== undefined && { tourId: dto.tourId }),
        ...(dto.bookingId !== undefined && { bookingId: dto.bookingId }),
        ...(dto.employeeId !== undefined && { employeeId: dto.employeeId }),
        ...(dto.partnerId !== undefined && { partnerId: dto.partnerId }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
      },
      select: TRANSACTION_SELECT,
    });

    return this.format(row);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.transaction.findUnique({
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

    await this.prisma.transaction.delete({ where: { id } });
  }
}
