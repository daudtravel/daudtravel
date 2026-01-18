/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const messages = {
    meta: (await import(`../messages/${locale}/meta.json`)).default,
    header: (await import(`../messages/${locale}/header.json`)).default,
    main: (await import(`../messages/${locale}/main.json`)).default,
    contact: (await import(`../messages/${locale}/contact.json`)).default,
    tours: (await import(`../messages/${locale}/tours.json`)).default,
    about: (await import(`../messages/${locale}/about.json`)).default,
    transfers: (await import(`../messages/${locale}/transfers.json`)).default,
    payment: (await import(`../messages/${locale}/payment.json`)).default,
  };

  return {
    locale,
    messages,
  };
});
