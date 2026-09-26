import { fetchFallbackRates, fetchNbgRates } from './rate-providers';

const mockFetch = (payload: unknown, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(payload),
  }) as unknown as typeof fetch;
};

describe('fetchNbgRates', () => {
  it('divides by the quoted quantity (RUB is per 100, AED per 10)', async () => {
    mockFetch([
      {
        date: '2026-09-19T00:00:00.000Z',
        currencies: [
          {
            code: 'USD',
            quantity: 1,
            rate: 2.6071,
            validFromDate: '2026-09-19T00:00:00.000Z',
          },
          {
            code: 'RUB',
            quantity: 100,
            rate: 3.0972,
            validFromDate: '2026-09-19T00:00:00.000Z',
          },
          {
            code: 'AED',
            quantity: 10,
            rate: 7.098,
            validFromDate: '2026-09-19T00:00:00.000Z',
          },
        ],
      },
    ]);

    const rates = await fetchNbgRates('2026-09-20');
    const by = Object.fromEntries(rates.map((r) => [r.currency, r]));
    expect(by.USD.rate).toBeCloseTo(2.6071, 6);
    expect(by.RUB.rate).toBeCloseTo(0.030972, 8);
    expect(by.AED.rate).toBeCloseTo(0.7098, 6);
    expect(by.USD.date).toBe('2026-09-19');
    expect(by.USD.source).toBe('NBG');
  });

  it('ignores currencies we do not track and unusable rates', async () => {
    mockFetch([
      {
        currencies: [
          { code: 'JPY', quantity: 100, rate: 1.65 },
          { code: 'USD', quantity: 1, rate: 0 },
          { code: 'EUR', quantity: 1, rate: 2.99 },
        ],
      },
    ]);
    const rates = await fetchNbgRates('2026-09-20');
    expect(rates.map((r) => r.currency)).toEqual(['EUR']);
  });

  it('falls back to the given day when NBG sends no date', async () => {
    mockFetch([{ currencies: [{ code: 'TRY', quantity: 1, rate: 0.0534 }] }]);
    const [rate] = await fetchNbgRates('2026-09-20');
    expect(rate.date).toBe('2026-09-20');
  });

  it('throws when the provider errors', async () => {
    mockFetch({}, false);
    await expect(fetchNbgRates('2026-09-20')).rejects.toThrow();
  });
});

describe('fetchFallbackRates', () => {
  it('inverts "units per GEL" into "GEL per unit"', async () => {
    mockFetch({ result: 'success', rates: { SAR: 1.439619, USD: 0.383899 } });
    const rates = await fetchFallbackRates('2026-09-20', ['SAR']);
    expect(rates).toHaveLength(1);
    expect(rates[0].currency).toBe('SAR');
    expect(rates[0].rate).toBeCloseTo(1 / 1.439619, 8);
    expect(rates[0].source).toBe('EXCHANGERATE_API');
  });

  it('throws when the payload is not a success', async () => {
    mockFetch({ result: 'error' });
    await expect(fetchFallbackRates('2026-09-20')).rejects.toThrow();
  });
});
