import { MailService } from './mail.service';

/** Stands in for the Resend HTTP API, answering every email the same way. */
const resendAnswers = (status: number, body: unknown) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
};

const senders: Array<[string, (mail: MailService) => Promise<void>]> = [
  [
    'quick payment admin notification',
    (mail) =>
      mail.sendQuickPaymentAdminNotification({
        order: {
          id: 'ord_1',
          externalOrderId: 'QP_test',
          customerFullName: 'Bader Ibrahim',
          customerEmail: 'customer@example.com',
          productName: 'Kazbegi day trip',
          quantity: 2,
          totalAmount: 535,
          paidAt: new Date('2026-10-12T11:25:00Z'),
        },
        adminEmail: 'office@example.com',
      }),
  ],
  [
    'quick payment customer confirmation',
    (mail) =>
      mail.sendQuickPaymentCustomerConfirmation({
        email: 'customer@example.com',
        customerFullName: 'Bader Ibrahim',
        externalOrderId: 'QP_test',
        productName: 'Kazbegi day trip',
        quantity: 2,
        totalAmount: 535,
      }),
  ],
  [
    'insurance admin notification',
    (mail) =>
      mail.sendInsuranceAdminNotification({
        submission: {
          id: 'sub_1',
          externalOrderId: 'INS_test',
          submitterEmail: 'traveller@example.com',
          peopleCount: 1,
          totalDays: 7,
          paidAt: new Date('2026-10-11T02:11:00Z'),
        },
        people: [
          {
            id: 'per_1',
            fullName: 'Salman Elrashedy',
            phoneNumber: '+995555000000',
            passportPhotoUrl: '/uploads/passports/p.jpg',
            startDate: new Date('2026-10-12'),
            endDate: new Date('2026-10-18'),
            totalDays: 7,
          },
        ],
        adminEmail: ['office@example.com'],
        baseUrl: 'https://api.example.com',
      }),
  ],
];

describe('MailService and Resend answers', () => {
  let mail: MailService;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
    mail = new MailService();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(senders)(
    '%s rejects when Resend refuses the email',
    async (_, send) => {
      resendAnswers(403, {
        statusCode: 403,
        name: 'validation_error',
        message: 'The daudtravel.com domain is not verified.',
      });

      await expect(send(mail)).rejects.toThrow(
        'The daudtravel.com domain is not verified.',
      );
    },
  );

  it.each(senders)(
    '%s resolves when Resend accepts the email',
    async (_, send) => {
      resendAnswers(200, { id: 'email_1' });

      await expect(send(mail)).resolves.toBeUndefined();
    },
  );
});
