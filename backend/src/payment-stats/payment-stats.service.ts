import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { humanizeBogRejectReason } from '@/common/utils/bog-payments';

export type PaymentType = 'tours' | 'transfers' | 'quick' | 'insurance';

export interface GroupedRow {
  type: PaymentType;
  month: string;
  status: string;
  count: number;
  amount: number;
}

interface FailureReasonRow {
  reason: string;
  count: number;
  last_at: Date;
}

interface RecentFailureRow {
  type: PaymentType;
  customer: string;
  amount: number;
  reason: string | null;
  method: string | null;
  created_at: Date;
}

// The failure reason lives in the rejection_reason column for tours/transfers
// and only inside the raw BOG callback JSON for quick payments and insurance.
const TOUR_REASON = Prisma.raw(
  `COALESCE(NULLIF(rejection_reason, ''), callback_data->'payment_detail'->>'code_description', callback_data->>'reject_reason')`,
);
const TRANSFER_REASON = TOUR_REASON;
const QUICK_REASON = Prisma.raw(
  `COALESCE("callbackData"->'payment_detail'->>'code_description', "callbackData"->>'reject_reason')`,
);
const INSURANCE_REASON = Prisma.raw(
  `COALESCE(callback_data->'payment_detail'->>'code_description', callback_data->>'reject_reason')`,
);

@Injectable()
export class PaymentStatsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [grouped, failureReasons, recentFailures] = await Promise.all([
      this.getGroupedStats(),
      this.getFailureReasons(),
      this.getRecentFailures(),
    ]);

    return {
      success: true,
      data: {
        grouped,
        failureReasons,
        recentFailures,
      },
    };
  }

  /**
   * One row per payment type x month x status with count and amount sum.
   * The frontend derives totals, per-type breakdowns and the monthly
   * revenue series from this single compact result set.
   */
  private async getGroupedStats(): Promise<GroupedRow[]> {
    const rows = await this.prisma.$queryRaw<GroupedRow[]>`
      SELECT
        type,
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        status::text AS status,
        count(*)::int AS count,
        COALESCE(sum(amount), 0)::float8 AS amount
      FROM (
        SELECT 'tours' AS type, created_at, status, paid_amount AS amount
        FROM tour_payment_orders
        UNION ALL
        SELECT 'transfers', created_at, status, payment_amount
        FROM transfer_payment_orders
        UNION ALL
        SELECT 'quick', "createdAt", status, product_total_price
        FROM quick_payment_orders
        UNION ALL
        SELECT 'insurance', created_at, status, total_amount
        FROM insurance_submissions
      ) all_orders
      GROUP BY 1, 2, 3
      ORDER BY 2 ASC, 1 ASC
    `;
    return rows;
  }

  private async getFailureReasons() {
    const rows = await this.prisma.$queryRaw<FailureReasonRow[]>`
      SELECT
        COALESCE(reason, 'Unknown') AS reason,
        count(*)::int AS count,
        max(created_at) AS last_at
      FROM (
        SELECT ${TOUR_REASON} AS reason, created_at
        FROM tour_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT ${TRANSFER_REASON}, created_at
        FROM transfer_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT ${QUICK_REASON}, "createdAt"
        FROM quick_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT ${INSURANCE_REASON}, created_at
        FROM insurance_submissions WHERE status = 'FAILED'
      ) failures
      GROUP BY 1
      ORDER BY 2 DESC
    `;

    return rows.map((row) => ({
      reason: humanizeBogRejectReason(row.reason) ?? 'Unknown',
      count: row.count,
      lastAt: row.last_at.toISOString(),
    }));
  }

  private async getRecentFailures() {
    const rows = await this.prisma.$queryRaw<RecentFailureRow[]>`
      SELECT * FROM (
        SELECT
          'tours' AS type,
          customer_first_name || ' ' || customer_last_name AS customer,
          paid_amount::float8 AS amount,
          ${TOUR_REASON} AS reason,
          payment_method AS method,
          created_at
        FROM tour_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT
          'transfers',
          customer_first_name || ' ' || customer_last_name,
          payment_amount::float8,
          ${TRANSFER_REASON},
          payment_method,
          created_at
        FROM transfer_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT
          'quick',
          "customerFullName",
          product_total_price::float8,
          ${QUICK_REASON},
          "paymentMethod",
          "createdAt"
        FROM quick_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT
          'insurance',
          submitter_email,
          total_amount::float8,
          ${INSURANCE_REASON},
          payment_method,
          created_at
        FROM insurance_submissions WHERE status = 'FAILED'
      ) failures
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return rows.map((row) => ({
      type: row.type,
      customer: row.customer,
      amount: row.amount,
      reason: humanizeBogRejectReason(row.reason) ?? 'Unknown',
      method: row.method,
      date: row.created_at.toISOString(),
    }));
  }
}
