import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "ka", "ru", "ar", "tr"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales: ["ka", "en", "ru", "ar", "tr"],
  defaultLocale: "ka",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
