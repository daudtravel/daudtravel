import { CommissionKind } from '@prisma/client';
import { computeTotals, money } from './booking-totals';

describe('computeTotals', () => {
  it('sums the lines of a package booking', () => {
    // The brief's example: a tour for 1000 and a hotel for 1000
    const totals = computeTotals(
      [
        { salePrice: 1000, costPrice: 700, driverId: 'd1' },
        { salePrice: 1000, costPrice: 820 },
        { salePrice: 0, costPrice: 25 }, // insurance included in the price
      ],
      [],
    );
    expect(totals.totalPrice.toFixed(2)).toBe('2000.00');
    expect(totals.totalCost.toFixed(2)).toBe('1545.00');
    expect(totals.profit.toFixed(2)).toBe('455.00');
  });

  it('takes a client referral percentage from the booking total', () => {
    const totals = computeTotals(
      [{ salePrice: 1000, costPrice: 600 }],
      [{ kind: CommissionKind.CLIENT_REFERRAL, rate: 10 }],
    );
    expect(totals.commissionAmounts[0].toFixed(2)).toBe('100.00');
    expect(totals.totalCommission.toFixed(2)).toBe('100.00');
    expect(totals.profit.toFixed(2)).toBe('300.00');
  });

  it("takes a driver referral percentage from that driver's earnings", () => {
    const totals = computeTotals(
      [
        { salePrice: 900, costPrice: 500, driverId: 'd1' },
        { salePrice: 600, costPrice: 400, driverId: 'd2' },
      ],
      [{ kind: CommissionKind.DRIVER_REFERRAL, driverId: 'd1', rate: 10 }],
    );
    // 10% of 500, not of the 1500 the client pays
    expect(totals.commissionAmounts[0].toFixed(2)).toBe('50.00');
    expect(totals.profit.toFixed(2)).toBe('550.00');
  });

  it('keeps a fixed amount when no rate is given', () => {
    const totals = computeTotals(
      [{ salePrice: 500, costPrice: 300 }],
      [{ kind: CommissionKind.OTHER, amount: 42.5 }],
    );
    expect(totals.commissionAmounts[0].toFixed(2)).toBe('42.50');
    expect(totals.profit.toFixed(2)).toBe('157.50');
  });

  it('rounds half up to two decimals', () => {
    const totals = computeTotals(
      [{ salePrice: '333.335', costPrice: 0 }],
      [{ kind: CommissionKind.CLIENT_REFERRAL, rate: 7.5 }],
    );
    expect(totals.totalPrice.toFixed(2)).toBe('333.34');
    expect(totals.commissionAmounts[0].toFixed(2)).toBe('25.00');
  });

  it('allows a loss to be recorded (it is only flagged in the UI)', () => {
    const totals = computeTotals([{ salePrice: 100, costPrice: 150 }], []);
    expect(totals.profit.toFixed(2)).toBe('-50.00');
  });

  it('treats a driver referral with no matching line as zero', () => {
    const totals = computeTotals(
      [{ salePrice: 100, costPrice: 50, driverId: 'd1' }],
      [{ kind: CommissionKind.DRIVER_REFERRAL, driverId: 'other', rate: 20 }],
    );
    expect(totals.commissionAmounts[0].toFixed(2)).toBe('0.00');
  });
});

describe('money', () => {
  it('rounds half up', () => {
    expect(money('2.345').toFixed(2)).toBe('2.35');
    expect(money('2.344').toFixed(2)).toBe('2.34');
    expect(money(-2.345).toFixed(2)).toBe('-2.35');
  });
});
