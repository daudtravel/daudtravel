import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/src/components/header/Header";
import Footer from "@/src/components/footer/Footer";
import { Locale, routing } from "@/src/i18n/routing";
import Script from "next/script";
import "./globals.css";
import SignInModal from "./(auth)/_signin/SigninModal";
import QueryProvider from "@/src/reactQuery/queryProvider";
import { AuthProvider } from "@/src/auth/authProvider";
import SignupModalWrapper from "./(auth)/_signup/SignupModalWrapper";
import { CHAT_CONFIG, initWhatsAppWidget } from "@/src/utlis/chats/OnlineChats";
import { SocialSection } from "./(main)/_components/SocialSection";
import ConsentBanner from "@/src/components/shared/ConsentBanner";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const t = await getTranslations("meta");
  return {
    title: {
      default: t("default"),
      template: `%s | ${t("daudTravel")}`,
    },
    description: t("descriptionMain"),
    charset: "UTF-8",
    openGraph: {
      title: t("default"),
      description: t("descriptionMain"),
      type: "website",
      locale: locale,
      url: "https://www.daudtravel.com",
      siteName: "Daud Travel",
    },
    icons: {
      icon: "/images/MainOG.jpg",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body>
        <Script id="whatsapp-widget" strategy="afterInteractive">
          {initWhatsAppWidget(CHAT_CONFIG.WHATSAPP_NUMBER)}
        </Script>

        <AuthProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <Header />
              <SignupModalWrapper />
              <SignInModal />
              {children}
              <Footer />
              <SocialSection />
              <ConsentBanner />
            </NextIntlClientProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
