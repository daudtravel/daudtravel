import { pickLocalization } from './pick-localization.util';

const ka = { locale: 'ka', name: 'ბათუმის ტური' };
const en = { locale: 'en', name: 'Batumi tour' };
const tr = { locale: 'tr', name: 'Batum turu' };
const ru = { locale: 'ru', name: 'Тур в Батуми' };

describe('pickLocalization', () => {
  it('prefers the requested locale', () => {
    expect(pickLocalization([ka, en, tr], 'tr')).toBe(tr);
  });

  it('falls back to ka when the requested locale is missing', () => {
    expect(pickLocalization([en, ka, ru], 'tr')).toBe(ka);
  });

  it('falls back to en when neither the requested locale nor ka exist', () => {
    expect(pickLocalization([ru, en], 'tr')).toBe(en);
  });

  it('falls back to the first available localization as a last resort', () => {
    expect(pickLocalization([ru, tr], 'ar')).toBe(ru);
  });

  it('returns undefined when there are no localizations', () => {
    expect(pickLocalization([], 'ka')).toBeUndefined();
    expect(pickLocalization(undefined, 'ka')).toBeUndefined();
  });

  it('treats a missing requested locale as ka', () => {
    expect(pickLocalization([en, ka], undefined)).toBe(ka);
  });
});
