import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.shell");
  return {
    title: { default: t("metaTitle"), template: `%s | ${t("metaTitle")}` },
    robots: { index: false, follow: false },
  };
}

/**
 * The root layout strips the (large) admin namespace for public pages; the
 * back office gets the complete message set here.
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}
