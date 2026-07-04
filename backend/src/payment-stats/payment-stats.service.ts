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
  type: PaymentType;
  month: string;
  count: number;
  last_at: Date;
}

interface OrderRow {
  type: PaymentType;
  customer: string;
  email: string | null;
  amount: number;
  status: string;
  reason: string | null;
  method: string | null;
  external_order_id: string;
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
    const [grouped, failureReasons] = await Promise.all([
      this.getGroupedStats(),
      this.getFailureReasons(),
    ]);

    return {
      success: true,
      data: {
        grouped,
        failureReasons,
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
    // grouped by type and month as well, so the dashboard can filter
    const rows = await this.prisma.$queryRaw<FailureReasonRow[]>`
      SELECT
        COALESCE(reason, 'Unknown') AS reason,
        type,
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        count(*)::int AS count,
        max(created_at) AS last_at
      FROM (
        SELECT 'tours' AS type, ${TOUR_REASON} AS reason, created_at
        FROM tour_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT 'transfers', ${TRANSFER_REASON}, created_at
        FROM transfer_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT 'quick', ${QUICK_REASON}, "createdAt"
        FROM quick_payment_orders WHERE status = 'FAILED'
        UNION ALL
        SELECT 'insurance', ${INSURANCE_REASON}, created_at
        FROM insurance_submissions WHERE status = 'FAILED'
      ) failures
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `;

    return rows.map((row) => ({
      reason: humanizeBogRejectReason(row.reason) ?? 'Unknown',
      type: row.type,
      month: row.month,
      count: row.count,
      lastAt: row.last_at.toISOString(),
    }));
  }

  /**
   * Unified, paginated list of payment orders across all four types,
   * optionally filtered by type and/or status.
   */
  async getOrders(
    type?: PaymentType,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const conditions: Prisma.Sql[] = [];
    if (type) conditions.push(Prisma.sql`type = ${type}`);
    if (status) conditions.push(Prisma.sql`status = ${status}`);
    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const allOrders = Prisma.sql`
      SELECT
        'tours' AS type,
        customer_first_name || ' ' || customer_last_name AS customer,
        customer_email AS email,
        paid_amount::float8 AS amount,
        status::text AS status,
        ${TOUR_REASON} AS reason,
        payment_method AS method,
        external_order_id,
        created_at
      FROM tour_payment_orders
      UNION ALL
      SELECT
        'transfers',
        customer_first_name || ' ' || customer_last_name,
        customer_email,
        payment_amount::float8,
        status::text,
        ${TRANSFER_REASON},
        payment_method,
        external_order_id,
        created_at
      FROM transfer_payment_orders
      UNION ALL
      SELECT
        'quick',
        "customerFullName",
        "customerEmail",
        product_total_price::float8,
        status::text,
        ${QUICK_REASON},
        "paymentMethod",
        "externalOrderId",
        "createdAt"
      FROM quick_payment_orders
      UNION ALL
      SELECT
        'insurance',
        submitter_email,
        submitter_email,
        total_amount::float8,
        status::text,
        ${INSURANCE_REASON},
        payment_method,
        external_order_id,
        created_at
      FROM insurance_submissions
    `;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<OrderRow[]>`
        SELECT * FROM (${allOrders}) orders
        ${where}
        ORDER BY created_at DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total FROM (${allOrders}) orders
        ${where}
      `,
    ]);

    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map((row) => ({
        type: row.type,
        customer: row.customer,
        email: row.email,
        amount: row.amount,
        status: row.status,
        reason:
          row.status === 'FAILED'
            ? (humanizeBogRejectReason(row.reason) ?? 'Unknown')
            : null,
        method: row.method,
        externalOrderId: row.external_order_id,
        date: row.created_at.toISOString(),
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
