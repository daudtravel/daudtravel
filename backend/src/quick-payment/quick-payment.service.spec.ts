import { PaymentStatus, Prisma, QuickPaymentOrder } from '@prisma/client';
import { FileUploadService } from '@/common/utils/file-upload.util';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { QuickPaymentService } from './quick-payment.service';

// uuid ships only as ESM, which Jest does not load; callbacks never need one
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }));
// Only BOG can sign a callback
jest.mock('@/common/utils/bog-payments', () => ({
  ...jest.requireActual<typeof import('@/common/utils/bog-payments')>(
    '@/common/utils/bog-payments',
  ),
  verifyBOGSignature: () => true,
}));

const pendingOrder: QuickPaymentOrder = {
  id: 'ord_1',
  linkId: 'link_1',
  customerFullName: 'Bader Ibrahim',
  customerEmail: 'customer@example.com',
  customerPhone: '+995555000000',
  productName: 'Kazbegi day trip',
  productDescription: null,
  productUnitPrice: new Prisma.Decimal('267.50'),
  productQuantity: 2,
  productTotalPrice: new Prisma.Decimal('535.00'),
  productLocale: 'en',
  externalOrderId: 'QP_test',
  bogOrderId: 'bog_1',
  paymentUrl: 'https://payment.bog.ge/?order_id=bog_1',
  status: PaymentStatus.PENDING,
  transactionId: null,
  paymentMethod: null,
  callbackData: null,
  emailSent: false,
  emailSentAt: null,
  expiresAt: new Date('2026-10-12T11:55:00Z'),
  paidAt: null,
  failedAt: null,
  createdAt: new Date('2026-10-12T11:25:00Z'),
  updatedAt: new Date('2026-10-12T11:25:00Z'),
};

const completedCallback = JSON.stringify({
  event: 'order_payment',
  body: {
    order_id: 'bog_1',
    external_order_id: 'QP_test',
    order_status: { key: 'completed' },
    transaction_id: 'tx_1',
    payment_method: 'card',
  },
});

/**
 * Stands in for the Resend HTTP API. Refuses emails addressed to `refused`
 * and returns the list of emails it accepted.
 */
const fakeResend = (refused?: string) => {
  const accepted: Array<{ to: string[] }> = [];
  global.fetch = jest.fn((_url: string, init?: RequestInit) => {
    // The SDK posts each email as a JSON string
    const email = JSON.parse(init?.body as string) as { to: string[] };
    if (refused && email.to.includes(refused)) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            statusCode: 422,
            name: 'validation_error',
            message: 'Invalid `to` field.',
          }),
          { status: 422, headers: { 'content-type': 'application/json' } },
        ),
      );
    }
    accepted.push(email);
    return Promise.resolve(
      new Response(JSON.stringify({ id: `email_${accepted.length}` }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  }) as unknown as typeof fetch;
  return accepted;
};

describe('QuickPaymentService emails for a paid order', () => {
  let row: QuickPaymentOrder;
  let service: QuickPaymentService;
  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.ADMIN_EMAIL = 'office@example.com';
    row = { ...pendingOrder };
    // One quick_payment_orders row; updates land on it like they would in Postgres
    const prisma = {
      quickPaymentOrder: {
        findFirst: () => Promise.resolve({ ...row }),
        findUnique: () => Promise.resolve({ ...row }),
        update: ({ data }: { data: Partial<QuickPaymentOrder> }) =>
          Promise.resolve(Object.assign(row, data)),
      },
    };
    service = new QuickPaymentService(
      prisma as unknown as PrismaService,
      {} as FileUploadService,
      new MailService(),
    );
    errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('emails the customer and ADMIN_EMAIL, then marks the order emailed', async () => {
    const accepted = fakeResend();

    await service.handleBOGCallback(completedCallback, 'signature');

    expect(accepted.map((email) => email.to)).toHaveLength(2);
    expect(accepted.map((email) => email.to)).toEqual(
      expect.arrayContaining([
        ['customer@example.com'],
        ['office@example.com'],
      ]),
    );
    expect(row.emailSent).toBe(true);
  });

  it('sends the admin notification to the office Gmail when ADMIN_EMAIL is unset', async () => {
    delete process.env.ADMIN_EMAIL;
    const accepted = fakeResend();

    await service.handleBOGCallback(completedCallback, 'signature');

    expect(accepted.map((email) => email.to)).toContainEqual([
      'traveldaud@gmail.com',
    ]);
  });

  it('leaves the order unmarked and logs it when Resend refuses the admin notification', async () => {
    fakeResend('office@example.com');

    await expect(
      service.handleBOGCallback(completedCallback, 'signature'),
    ).resolves.toEqual({ success: true, status: PaymentStatus.PAID });

    expect(row.status).toBe(PaymentStatus.PAID);
    expect(row.emailSent).toBe(false);
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('ord_1'),
      expect.anything(),
    );
  });

  it('still sends the admin notification when Resend refuses the customer confirmation', async () => {
    const accepted = fakeResend('customer@example.com');

    await service.handleBOGCallback(completedCallback, 'signature');

    expect(accepted.map((email) => email.to)).toEqual([['office@example.com']]);
    expect(row.emailSent).toBe(true);
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('QP_test'),
      expect.anything(),
    );
  });
});
