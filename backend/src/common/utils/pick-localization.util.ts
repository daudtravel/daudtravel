export const DEFAULT_LOCALE = 'ka';

/**
 * Picks the best localization for admin-facing responses:
 * requested locale → ka → en → first available.
 *
 * Mirrors the frontend's pickLocalization so admin lists show a translation an
 * editor has actually filled in rather than a placeholder. Public-facing
 * endpoints must NOT use this — untranslated content stays hidden there.
 */
export function pickLocalization<T extends { locale: string }>(
  localizations: T[] | undefined,
  locale: string | undefined,
): T | undefined {
  if (!localizations?.length) return undefined;
  const requested = locale || DEFAULT_LOCALE;
  return (
    localizations.find((l) => l.locale === requested) ??
    localizations.find((l) => l.locale === DEFAULT_LOCALE) ??
    localizations.find((l) => l.locale === 'en') ??
    localizations[0]
  );
}
