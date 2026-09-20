import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  BookingType,
  Currency,
  PermissionModule,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import { CurrencyService } from '@/currency/currency.service';
import type { AuthUser } from '@/access/access.types';
import { parseDateRange, todayDateOnly } from '@/common/utils/date-only.util';
import { money } from '@/bookings/booking-totals';
import { FinanceReportQueryDto } from './dto/finance.dto';

const ZERO = new Prisma.Decimal(0);

/** Bookings, website payments and the ledger, added up in one currency. */
@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly currency: CurrencyService,
  ) {}

  async report(user: AuthUser, query: FinanceReportQueryDto) {
    const range = parseDateRange(query.dateFrom, query.dateTo);
    const display = query.displayCurrency ?? Currency.GEL;
    // Everything is summed in GEL (each row keeps the rate it was saved with)
    // and converted once at the end, with today's rate.
    const displayRate = await this.currency.getRate(display, todayDateOnly());
    const toDisplay = (gel: Prisma.Decimal) =>
      Number(money(gel.div(displayRate)));

    const bookingScopes = this.bookingScopes(user);
    const canSeeOnline =
      this.access.can(user, PermissionModule.ONLINE_ORDERS, 'view') ||
      this.access.canAll(user, PermissionModule.FINANCE, 'view');

    const bookings = bookingScopes.length
      ? await this.prisma.booking.findMany({
          where: {
            AND: [
              { OR: bookingScopes },
              { status: { not: BookingStatus.CANCELLED } },
              ...(range ? [{ startDate: range }] : []),
              ...(query.bookingType ? [{ type: query.bookingType }] : []),
              ...(query.createdById
                ? [{ createdById: query.createdById }]
                : []),
              ...(query.partnerId ? [{ referrerId: query.partnerId }] : []),
              ...(query.vehicleId ||
              query.driverId ||
              query.hotelId ||
              query.tourId
                ? [
                    {
                      items: {
                        some: {
                          ...(query.vehicleId && {
                            vehicleId: query.vehicleId,
                          }),
                          ...(query.driverId && { driverId: query.driverId }),
                          ...(query.hotelId && { hotelId: query.hotelId }),
                          ...(query.tourId && { tourId: query.tourId }),
                        },
                      },
                    },
                  ]
                : []),
            ],
          },
          select: {
            id: true,
            type: true,
            startDate: true,
            currency: true,
            fxRate: true,
            totalPrice: true,
            totalCost: true,
            totalCommission: true,
            paidAmount: true,
            balanceDue: true,
            items: {
              select: {
                type: true,
                salePrice: true,
                costPrice: true,
                supplierPaid: true,
                hotelId: true,
                driverId: true,
                vehicleId: true,
                hotel: { select: { id: true, name: true } },
                driver: {
                  select: { id: true, firstName: true, lastName: true },
                },
                vehicle: { select: { id: true, brand: true, model: true } },
              },
            },
            commissions: {
              select: {
                partnerId: true,
                recipientName: true,
                amount: true,
                paid: true,
              },
            },
          },
          take: 20000,
        })
      : [];

    const transactions = this.access.can(
      user,
      PermissionModule.TRANSACTIONS,
      'view',
    )
      ? await this.prisma.transaction.findMany({
          where: {
            ...(this.access.scopeWhere(
              user,
              PermissionModule.TRANSACTIONS,
              'view',
            ) ?? {}),
            ...(range && { date: range }),
            ...(query.vehicleId && { vehicleId: query.vehicleId }),
            ...(query.driverId && { driverId: query.driverId }),
            ...(query.hotelId && { hotelId: query.hotelId }),
            ...(query.tourId && { tourId: query.tourId }),
            ...(query.partnerId && { partnerId: query.partnerId }),
            ...(query.createdById && { createdById: query.createdById }),
          },
          select: {
            type: true,
            category: true,
            date: true,
            amount: true,
            fxRate: true,
            vehicleId: true,
            vehicle: { select: { id: true, brand: true, model: true } },
          },
          take: 20000,
        })
      : [];

    // Website money that never became a booking (otherwise it would be counted
    // twice: once online and once in the booking).
    const online =
      canSeeOnline && !query.bookingType && !query.createdById
        ? await this.onlineIncome(range, query)
        : { total: ZERO, byMonth: new Map<string, Prisma.Decimal>() };

    return {
      data: this.build(
        bookings,
        transactions,
        online,
        display,
        Number(displayRate),
        toDisplay,
        query,
      ),
    };
  }

  /** Booking types the user may see, each with its record scope. */
  private bookingScopes(user: AuthUser): Prisma.BookingWhereInput[] {
    const modules: Record<BookingType, PermissionModule> = {
      [BookingType.HOTEL]: PermissionModule.BOOKINGS_HOTEL,
      [BookingType.TOUR]: PermissionModule.BOOKINGS_TOUR,
      [BookingType.TRANSFER]: PermissionModule.BOOKINGS_TOUR,
      [BookingType.PACKAGE]: PermissionModule.BOOKINGS_PACKAGE,
    };
    const filters: Prisma.BookingWhereInput[] = [];
    for (const [type, module] of Object.entries(modules) as [
      BookingType,
      PermissionModule,
    ][]) {
      const scope = this.access.scopeWhere(user, module, 'view');
      if (scope) filters.push({ type, ...scope });
    }
    return filters;
  }

  private async onlineIncome(
    range: { gte?: Date; lt?: Date } | undefined,
    query: FinanceReportQueryDto,
  ) {
    // Paid and not yet turned into a booking. Only the plain filters apply —
    // a website order has no vehicle, driver or hotel of its own.
    if (query.vehicleId || query.driverId || query.hotelId || query.partnerId) {
      return { total: ZERO, byMonth: new Map<string, Prisma.Decimal>() };
    }

    const paidIn = range
      ? {
          OR: [
            { paidAt: range },
            { AND: [{ paidAt: null }, { createdAt: range }] },
          ],
        }
      : {};

    const [tours, transfers, quick, insurance] = await Promise.all([
      this.prisma.tourPaymentOrder.findMany({
        where: { status: 'PAID', booking: { is: null }, ...paidIn },
        select: { paidAmount: true, paidAt: true, createdAt: true },
        take: 20000,
      }),
      this.prisma.transferPaymentOrder.findMany({
        where: { status: 'PAID', booking: { is: null }, ...paidIn },
        select: { paymentAmount: true, paidAt: true, createdAt: true },
        take: 20000,
      }),
      this.prisma.quickPaymentOrder.findMany({
        where: { status: 'PAID', ...paidIn },
        select: { productTotalPrice: true, paidAt: true, createdAt: true },
        take: 20000,
      }),
      this.prisma.insuranceSubmission.findMany({
        where: { status: 'PAID', ...paidIn },
        select: { totalAmount: true, paidAt: true, createdAt: true },
        take: 20000,
      }),
    ]);

    let total = ZERO;
    const byMonth = new Map<string, Prisma.Decimal>();
    const add = (amount: Prisma.Decimal, when: Date) => {
      total = total.add(amount);
      const key = when.toISOString().slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? ZERO).add(amount));
    };

    // Website payments are always in GEL
    for (const row of tours) {
      add(new Prisma.Decimal(row.paidAmount), row.paidAt ?? row.createdAt);
    }
    for (const row of transfers) {
      add(new Prisma.Decimal(row.paymentAmount), row.paidAt ?? row.createdAt);
    }
    for (const row of quick) {
      add(
        new Prisma.Decimal(row.productTotalPrice),
        row.paidAt ?? row.createdAt,
      );
    }
    for (const row of insurance) {
      add(new Prisma.Decimal(row.totalAmount), row.paidAt ?? row.createdAt);
    }

    return { total, byMonth };
  }

  private build(
    bookings: Awaited<ReturnType<FinanceService['loadBookingsType']>>,
    transactions: Awaited<ReturnType<FinanceService['loadTransactionsType']>>,
    online: { total: Prisma.Decimal; byMonth: Map<string, Prisma.Decimal> },
    displayCurrency: Currency,
    displayRate: number,
    toDisplay: (gel: Prisma.Decimal) => number,
    query: FinanceReportQueryDto,
  ) {
    const monthKey = (date: Date) => date.toISOString().slice(0, 7);
    const monthly = new Map<
      string,
      {
        revenue: Prisma.Decimal;
        expenses: Prisma.Decimal;
        profit: Prisma.Decimal;
      }
    >();
    const bumpMonth = (
      key: string,
      field: 'revenue' | 'expenses' | 'profit',
      amount: Prisma.Decimal,
    ) => {
      const row = monthly.get(key) ?? {
        revenue: ZERO,
        expenses: ZERO,
        profit: ZERO,
      };
      row[field] = row[field].add(amount);
      monthly.set(key, row);
    };

    let revenue = ZERO;
    let costOfSales = ZERO;
    let commissions = ZERO;
    let received = ZERO;
    let outstanding = ZERO;

    const byType = new Map<
      BookingType,
      {
        count: number;
        revenue: Prisma.Decimal;
        cost: Prisma.Decimal;
        commission: Prisma.Decimal;
      }
    >();
    const byItemType = new Map<
      string,
      { revenue: Prisma.Decimal; cost: Prisma.Decimal }
    >();
    const perVehicle = new Map<
      string,
      {
        label: string;
        revenue: Prisma.Decimal;
        cost: Prisma.Decimal;
        expenses: Prisma.Decimal;
      }
    >();
    const hotels = new Map<
      string,
      { name: string; revenue: Prisma.Decimal; cost: Prisma.Decimal }
    >();
    const drivers = new Map<
      string,
      { name: string; earned: Prisma.Decimal; paid: Prisma.Decimal }
    >();
    const partners = new Map<
      string,
      { name: string; amount: Prisma.Decimal; paid: Prisma.Decimal }
    >();
    const byCurrency = new Map<
      Currency,
      { revenue: Prisma.Decimal; cost: Prisma.Decimal; profit: Prisma.Decimal }
    >();

    for (const booking of bookings) {
      const rate = new Prisma.Decimal(booking.fxRate);
      const price = new Prisma.Decimal(booking.totalPrice).mul(rate);
      const cost = new Prisma.Decimal(booking.totalCost).mul(rate);
      const commission = new Prisma.Decimal(booking.totalCommission).mul(rate);

      revenue = revenue.add(price);
      costOfSales = costOfSales.add(cost);
      commissions = commissions.add(commission);
      received = received.add(new Prisma.Decimal(booking.paidAmount).mul(rate));
      outstanding = outstanding.add(
        new Prisma.Decimal(booking.balanceDue).mul(rate),
      );

      const key = monthKey(booking.startDate);
      bumpMonth(key, 'revenue', price);
      bumpMonth(key, 'profit', price.sub(cost).sub(commission));

      const typeRow = byType.get(booking.type) ?? {
        count: 0,
        revenue: ZERO,
        cost: ZERO,
        commission: ZERO,
      };
      typeRow.count += 1;
      typeRow.revenue = typeRow.revenue.add(price);
      typeRow.cost = typeRow.cost.add(cost);
      typeRow.commission = typeRow.commission.add(commission);
      byType.set(booking.type, typeRow);

      const original = byCurrency.get(booking.currency) ?? {
        revenue: ZERO,
        cost: ZERO,
        profit: ZERO,
      };
      original.revenue = original.revenue.add(booking.totalPrice);
      original.cost = original.cost.add(booking.totalCost);
      original.profit = original.profit
        .add(booking.totalPrice)
        .sub(booking.totalCost)
        .sub(booking.totalCommission);
      byCurrency.set(booking.currency, original);

      for (const item of booking.items) {
        const sale = new Prisma.Decimal(item.salePrice).mul(rate);
        const itemCost = new Prisma.Decimal(item.costPrice).mul(rate);

        const itemRow = byItemType.get(item.type) ?? {
          revenue: ZERO,
          cost: ZERO,
        };
        itemRow.revenue = itemRow.revenue.add(sale);
        itemRow.cost = itemRow.cost.add(itemCost);
        byItemType.set(item.type, itemRow);

        if (item.vehicle) {
          const row = perVehicle.get(item.vehicle.id) ?? {
            label: `${item.vehicle.brand} ${item.vehicle.model}`,
            revenue: ZERO,
            cost: ZERO,
            expenses: ZERO,
          };
          row.revenue = row.revenue.add(sale);
          row.cost = row.cost.add(itemCost);
          perVehicle.set(item.vehicle.id, row);
        }

        if (item.hotel) {
          const row = hotels.get(item.hotel.id) ?? {
            name: item.hotel.name,
            revenue: ZERO,
            cost: ZERO,
          };
          row.revenue = row.revenue.add(sale);
          row.cost = row.cost.add(itemCost);
          hotels.set(item.hotel.id, row);
        }

        if (item.driver) {
          const row = drivers.get(item.driver.id) ?? {
            name: `${item.driver.firstName} ${item.driver.lastName}`,
            earned: ZERO,
            paid: ZERO,
          };
          row.earned = row.earned.add(itemCost);
          if (item.supplierPaid) row.paid = row.paid.add(itemCost);
          drivers.set(item.driver.id, row);
        }
      }

      for (const row of booking.commissions) {
        const amount = new Prisma.Decimal(row.amount).mul(rate);
        const id = row.partnerId ?? `name:${row.recipientName}`;
        const partner = partners.get(id) ?? {
          name: row.recipientName,
          amount: ZERO,
          paid: ZERO,
        };
        partner.amount = partner.amount.add(amount);
        if (row.paid) partner.paid = partner.paid.add(amount);
        partners.set(id, partner);
      }
    }

    let otherIncome = ZERO;
    let expenses = ZERO;
    const expensesByCategory = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      const amount = new Prisma.Decimal(transaction.amount).mul(
        transaction.fxRate,
      );
      const key = monthKey(transaction.date);
      if (transaction.type === TransactionType.INCOME) {
        otherIncome = otherIncome.add(amount);
        bumpMonth(key, 'revenue', amount);
        bumpMonth(key, 'profit', amount);
      } else {
        expenses = expenses.add(amount);
        bumpMonth(key, 'expenses', amount);
        bumpMonth(key, 'profit', amount.neg());
        expensesByCategory.set(
          transaction.category,
          (expensesByCategory.get(transaction.category) ?? ZERO).add(amount),
        );
        if (transaction.vehicle) {
          const row = perVehicle.get(transaction.vehicle.id) ?? {
            label: `${transaction.vehicle.brand} ${transaction.vehicle.model}`,
            revenue: ZERO,
            cost: ZERO,
            expenses: ZERO,
          };
          row.expenses = row.expenses.add(amount);
          perVehicle.set(transaction.vehicle.id, row);
        }
      }
    }

    for (const [key, amount] of online.byMonth) {
      bumpMonth(key, 'revenue', amount);
      bumpMonth(key, 'profit', amount);
    }

    const bookingProfit = revenue.sub(costOfSales).sub(commissions);
    const netResult = bookingProfit
      .add(online.total)
      .add(otherIncome)
      .sub(expenses);

    return {
      period: { from: query.dateFrom ?? null, to: query.dateTo ?? null },
      displayCurrency,
      displayRate,
      kpis: {
        revenue: toDisplay(revenue),
        costOfSales: toDisplay(costOfSales),
        commissions: toDisplay(commissions),
        grossProfit: toDisplay(revenue.sub(costOfSales)),
        bookingProfit: toDisplay(bookingProfit),
        onlineIncome: toDisplay(online.total),
        otherIncome: toDisplay(otherIncome),
        expenses: toDisplay(expenses),
        netResult: toDisplay(netResult),
        received: toDisplay(received),
        outstanding: toDisplay(outstanding),
        bookings: bookings.length,
      },
      monthly: [...monthly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, row]) => ({
          month,
          revenue: toDisplay(row.revenue),
          expenses: toDisplay(row.expenses),
          profit: toDisplay(row.profit),
        })),
      expensesByCategory: [...expensesByCategory.entries()]
        .map(([category, amount]) => ({
          category,
          amount: toDisplay(amount),
        }))
        .sort((a, b) => b.amount - a.amount),
      byBookingType: [...byType.entries()].map(([type, row]) => ({
        type,
        count: row.count,
        revenue: toDisplay(row.revenue),
        cost: toDisplay(row.cost),
        commission: toDisplay(row.commission),
        profit: toDisplay(row.revenue.sub(row.cost).sub(row.commission)),
      })),
      byItemType: [...byItemType.entries()]
        .map(([type, row]) => ({
          type,
          revenue: toDisplay(row.revenue),
          cost: toDisplay(row.cost),
          profit: toDisplay(row.revenue.sub(row.cost)),
        }))
        .sort((a, b) => b.profit - a.profit),
      perVehicle: [...perVehicle.entries()]
        .map(([id, row]) => ({
          vehicleId: id,
          label: row.label,
          revenue: toDisplay(row.revenue),
          cost: toDisplay(row.cost),
          expenses: toDisplay(row.expenses),
          net: toDisplay(row.revenue.sub(row.cost).sub(row.expenses)),
        }))
        .sort((a, b) => b.net - a.net),
      hotels: [...hotels.entries()]
        .map(([id, row]) => ({
          hotelId: id,
          name: row.name,
          revenue: toDisplay(row.revenue),
          cost: toDisplay(row.cost),
          commission: toDisplay(row.revenue.sub(row.cost)),
        }))
        .sort((a, b) => b.commission - a.commission),
      driverPayouts: [...drivers.entries()]
        .map(([id, row]) => ({
          driverId: id,
          name: row.name,
          earned: toDisplay(row.earned),
          paid: toDisplay(row.paid),
          outstanding: toDisplay(row.earned.sub(row.paid)),
        }))
        .sort((a, b) => b.earned - a.earned),
      partnerCommissions: [...partners.entries()]
        .map(([id, row]) => ({
          partnerId: id.startsWith('name:') ? null : id,
          name: row.name,
          amount: toDisplay(row.amount),
          paid: toDisplay(row.paid),
          unpaid: toDisplay(row.amount.sub(row.paid)),
        }))
        .sort((a, b) => b.amount - a.amount),
      byCurrency: [...byCurrency.entries()].map(([currency, row]) => ({
        currency,
        revenue: Number(money(row.revenue)),
        cost: Number(money(row.cost)),
        profit: Number(money(row.profit)),
      })),
    };
  }

  // Helpers only used for their types
  private loadBookingsType() {
    return this.prisma.booking.findMany({
      select: {
        id: true,
        type: true,
        startDate: true,
        currency: true,
        fxRate: true,
        totalPrice: true,
        totalCost: true,
        totalCommission: true,
        paidAmount: true,
        balanceDue: true,
        items: {
          select: {
            type: true,
            salePrice: true,
            costPrice: true,
            supplierPaid: true,
            hotelId: true,
            driverId: true,
            vehicleId: true,
            hotel: { select: { id: true, name: true } },
            driver: { select: { id: true, firstName: true, lastName: true } },
            vehicle: { select: { id: true, brand: true, model: true } },
          },
        },
        commissions: {
          select: {
            partnerId: true,
            recipientName: true,
            amount: true,
            paid: true,
          },
        },
      },
    });
  }

  private loadTransactionsType() {
    return this.prisma.transaction.findMany({
      select: {
        type: true,
        category: true,
        date: true,
        amount: true,
        fxRate: true,
        vehicleId: true,
        vehicle: { select: { id: true, brand: true, model: true } },
      },
    });
  }
}
