import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Currency, Prisma, RateSource } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  formatDateOnly,
  parseDateOnly,
  parseDateRange,
  todayDateOnly,
} from '@/common/utils/date-only.util';
import {
  BASE_CURRENCY,
  RATE_CURRENCIES,
  RATE_SORT_FIELDS,
  STALE_AFTER_DAYS,
} from './currency.constants';
import {
  fetchFallbackRates,
  fetchNbgRates,
  type FetchedRate,
} from './rate-providers';
import type { ListRatesQueryDto, SetRateDto } from './dto/currency.dto';

export interface RateInfo {
  currency: Currency;
  rate: number;
  date: string | null;
  source: RateSource | null;
  /** True when the rate is older than the requested day (no newer one yet). */
  stale?: boolean;
}

@Injectable()
export class CurrencyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fills in today's rates at start-up if they are missing (never blocks boot). */
  onApplicationBootstrap() {
    void this.refreshIfMissing().catch((error) =>
      this.logger.warn(
        `Initial exchange-rate refresh failed: ${(error as Error).message}`,
      ),
    );
  }

  /** NBG publishes once a day; 01:30 Tbilisi time is comfortably after that. */
  @Cron('0 30 1 * * *', { timeZone: 'Asia/Tbilisi' })
  async scheduledRefresh() {
    try {
      const result = await this.refreshRates();
      this.logger.log(
        `Exchange rates refreshed: ${result.saved} saved (${result.sources.join(', ') || 'none'})`,
      );
    } catch (error) {
      this.logger.error(
        `Scheduled exchange-rate refresh failed: ${(error as Error).message}`,
      );
    }
  }

  async refreshIfMissing() {
    const today = todayDateOnly();
    const have = await this.prisma.exchangeRate.count({
      where: { date: today },
    });
    if (have >= RATE_CURRENCIES.length) return { saved: 0, sources: [] };
    return this.refreshRates();
  }

  /**
   * Pulls fresh rates: NBG first (official), the fallback provider for
   * whatever NBG does not publish (SAR) or when NBG is unreachable.
   * Manual rates are never overwritten.
   */
  async refreshRates(): Promise<{
    saved: number;
    sources: string[];
    missing: Currency[];
  }> {
    const today = formatDateOnly(todayDateOnly()) as string;
    const collected = new Map<Currency, FetchedRate>();
    const sources: string[] = [];

    try {
      const nbg = await fetchNbgRates(today);
      for (const rate of nbg) collected.set(rate.currency, rate);
      if (nbg.length) sources.push('NBG');
    } catch (error) {
      this.logger.warn(`NBG unavailable: ${(error as Error).message}`);
    }

    const missing = RATE_CURRENCIES.filter((c) => !collected.has(c));
    if (missing.length) {
      try {
        const fallback = await fetchFallbackRates(today, missing);
        for (const rate of fallback) collected.set(rate.currency, rate);
        if (fallback.length) sources.push('exchangerate-api');
      } catch (error) {
        this.logger.warn(
          `Fallback provider unavailable: ${(error as Error).message}`,
        );
      }
    }

    let saved = 0;
    for (const rate of collected.values()) {
      const date = parseDateOnly(rate.date);
      const existing = await this.prisma.exchangeRate.findUnique({
        where: { currency_date: { currency: rate.currency, date } },
      });
      // An administrator's manual rate wins for that day.
      if (existing?.source === RateSource.MANUAL) continue;

      await this.prisma.exchangeRate.upsert({
        where: { currency_date: { currency: rate.currency, date } },
        create: {
          currency: rate.currency,
          date,
          rate: new Prisma.Decimal(rate.rate.toFixed(8)),
          source: rate.source,
        },
        update: {
          rate: new Prisma.Decimal(rate.rate.toFixed(8)),
          source: rate.source,
          fetchedAt: new Date(),
        },
      });
      saved++;
    }

    return {
      saved,
      sources,
      missing: RATE_CURRENCIES.filter((c) => !collected.has(c)),
    };
  }

  /** Latest known rate per currency (used by the rates page and pickers). */
  async getLatestRates(): Promise<RateInfo[]> {
    const today = todayDateOnly();
    const rows = await this.prisma.exchangeRate.findMany({
      where: { date: { lte: today } },
      orderBy: [{ currency: 'asc' }, { date: 'desc' }],
    });

    const latest = new Map<Currency, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latest.has(row.currency)) latest.set(row.currency, row);
    }

    return [
      {
        currency: BASE_CURRENCY,
        rate: 1,
        date: formatDateOnly(today),
        source: null,
      },
      ...RATE_CURRENCIES.map((currency) => {
        const row = latest.get(currency);
        // NBG doesn't publish on weekends and holidays, so a rate is only
        // flagged as outdated after a few days.
        const ageInDays = row
          ? Math.floor(
              (today.getTime() - row.date.getTime()) / (24 * 60 * 60 * 1000),
            )
          : Infinity;
        return {
          currency,
          rate: row ? Number(row.rate) : 0,
          date: row ? formatDateOnly(row.date) : null,
          source: row?.source ?? null,
          stale: ageInDays > STALE_AFTER_DAYS,
        };
      }),
    ];
  }

  /**
   * GEL per 1 unit of `currency` on `date` (the newest rate on or before it,
   * otherwise the newest known). Throws RATE_UNAVAILABLE if there is none, so
   * money is never saved with a silently wrong conversion.
   */
  async getRate(currency: Currency, date?: Date): Promise<Prisma.Decimal> {
    if (currency === BASE_CURRENCY) return new Prisma.Decimal(1);

    const on = date ?? todayDateOnly();
    const row =
      (await this.prisma.exchangeRate.findFirst({
        where: { currency, date: { lte: on } },
        orderBy: { date: 'desc' },
      })) ??
      (await this.prisma.exchangeRate.findFirst({
        where: { currency },
        orderBy: { date: 'desc' },
      }));

    if (!row) {
      throw new BadRequestException('RATE_UNAVAILABLE');
    }
    return row.rate;
  }

  /** Converts an amount between two currencies using the rates of `date`. */
  async convert(
    amount: Prisma.Decimal | number,
    from: Currency,
    to: Currency,
    date?: Date,
  ): Promise<Prisma.Decimal> {
    const value =
      amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
    if (from === to) return value;
    const [fromRate, toRate] = await Promise.all([
      this.getRate(from, date),
      this.getRate(to, date),
    ]);
    // value → GEL → target
    return value.mul(fromRate).div(toRate);
  }

  async listRates(query: ListRatesQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      RATE_SORT_FIELDS,
      'date',
    );
    const range = parseDateRange(query.dateFrom, query.dateTo);

    const where: Prisma.ExchangeRateWhereInput = {
      ...(query.currency && { currency: query.currency }),
      ...(query.source && { source: query.source }),
      ...(range && { date: range }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { currency: 'asc' }],
      }),
      this.prisma.exchangeRate.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        currency: row.currency,
        date: formatDateOnly(row.date),
        rate: Number(row.rate),
        source: row.source,
        fetchedAt: row.fetchedAt.toISOString(),
      })),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Manual override for one currency/day (kept on later refreshes). */
  async setManualRate(dto: SetRateDto) {
    if (dto.currency === BASE_CURRENCY) {
      throw new BadRequestException('BASE_CURRENCY_RATE');
    }
    const date = parseDateOnly(dto.date, 'date');
    const row = await this.prisma.exchangeRate.upsert({
      where: { currency_date: { currency: dto.currency, date } },
      create: {
        currency: dto.currency,
        date,
        rate: new Prisma.Decimal(dto.rate),
        source: RateSource.MANUAL,
      },
      update: {
        rate: new Prisma.Decimal(dto.rate),
        source: RateSource.MANUAL,
        fetchedAt: new Date(),
      },
    });
    return {
      id: row.id,
      currency: row.currency,
      date: formatDateOnly(row.date),
      rate: Number(row.rate),
      source: row.source,
    };
  }
}
