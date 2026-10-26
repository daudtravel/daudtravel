/**
 * One-off: re-sends the admin "new quick payment" email for paid orders whose
 * notification went to a wrong ADMIN_EMAIL. Only the admin is emailed and the
 * database is not changed. Dry run unless --send is given.
 *
 *   docker exec daudtravel_backend_prod node dist/scripts/send-missed-quick-payment-emails.js \
 *     --since 2026-10-06T23:41:21Z [--until <ISO date>] [--send]
 */
import { PaymentStatus, PrismaClient } from '@prisma/client';
import { MailService } from '@/mail/mail.service';
import {
  quickPaymentAdminEmail,
  toAdminNotificationOrder,
} from '@/quick-payment/admin-notification.util';

// Resend accepts 2 requests a second by default
const SEND_GAP_MS = 600;

function dateArg(name: string): Date | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  const date = new Date(process.argv[index + 1]);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} needs an ISO date, e.g. 2026-10-06T23:41:21Z`);
  }
  return date;
}

async function main() {
  const since = dateArg('--since');
  const until = dateArg('--until');
  const send = process.argv.includes('--send');

  if (!since) {
    throw new Error(
      'Usage: send-missed-quick-payment-emails --since <ISO date> [--until <ISO date>] [--send]',
    );
  }

  const prisma = new PrismaClient();
  try {
    const orders = await prisma.quickPaymentOrder.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: since, ...(until && { lt: until }) },
      },
      orderBy: { paidAt: 'asc' },
    });

    const adminEmail = quickPaymentAdminEmail();
    const range = until
      ? `${since.toISOString()} – ${until.toISOString()}`
      : `since ${since.toISOString()}`;
    console.log(
      `${orders.length} paid quick payment(s) ${range} → ${adminEmail}` +
        (send ? '' : '  (dry run, add --send to email them)'),
    );

    const mail = send ? new MailService() : null;
    let failed = 0;

    for (const order of orders) {
      const line = [
        order.paidAt?.toISOString(),
        order.externalOrderId,
        `₾${Number(order.productTotalPrice).toFixed(2)}`,
        order.customerFullName,
      ].join('  ');

      if (!mail) {
        console.log(`  ${line}`);
        continue;
      }

      try {
        await mail.sendQuickPaymentAdminNotification({
          order: toAdminNotificationOrder(order),
          adminEmail,
        });
        console.log(`  ✅ ${line}`);
      } catch {
        // MailService has already logged Resend's reason
        failed++;
        console.log(`  ❌ ${line}`);
      }
      await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
    }

    if (failed) {
      console.error(`${failed} of ${orders.length} not sent`);
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
