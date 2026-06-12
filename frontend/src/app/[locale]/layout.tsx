import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/src/components/header/Header";
import Footer from "@/src/components/footer/Footer";
import { Locale, routing } from "@/src/i18n/routing";
import Script from "next/script";
import "./globals.css";
import SignInModal from "./(auth)/_signin/SigninModal";
import QueryProvider from "@/src/reactQuery/queryProvider";
import { AuthProvider } from "@/src/auth/authProvider";
import { CHAT_CONFIG, initWhatsAppWidget } from "@/src/utlis/chats/OnlineChats";
import { SocialSection } from "./(main)/_components/SocialSection";
import ConsentBanner from "@/src/components/shared/ConsentBanner";
import { Toaster } from "sonner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  const t = await getTranslations("meta");

  const BASE_URL = "https://www.daudtravel.com";
  const locales = ["ka", "en", "ru", "ar", "tr"] as const;

  return {
    title: {
      default: t("default"),
      template: `%s | ${t("daudTravel")}`,
    },
    description: t("descriptionMain"),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}`])
        ),
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: t("default"),
      description: t("descriptionMain"),
      type: "website",
      locale: locale,
      url: `${BASE_URL}/${locale}`,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: "Daud Travel - Premium Tours in Georgia",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("default"),
      description: t("descriptionMain"),
      images: [`${BASE_URL}/images/MainOG.jpg`],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://www.daudtravel.com/#organization",
  name: "Daud Travel",
  url: "https://www.daudtravel.com",
  logo: {
    "@type": "ImageObject",
    url: "https://www.daudtravel.com/images/Logo.png",
  },
  image: "https://www.daudtravel.com/images/MainOG.jpg",
  description:
    "Daud Travel is a leading tourism company in Georgia offering premium tours, airport transfers, and travel insurance.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "St.Chabua Amirejibi #4",
    addressCountry: "GE",
    addressLocality: "Batumi",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "41.6443898",
    longitude: "41.6346718",
  },
  areaServed: {
    "@type": "Country",
    name: "Georgia",
  },
  serviceType: [
    "Group Tours",
    "Individual Tours",
    "Airport Transfers",
    "Travel Insurance",
    "Cultural Tours",
    "Wine Tours",
    "Nature Tours",
  ],
  priceRange: "$$",
  telephone: "+995557442212",
  email: "traveldaud@gmail.com",
  sameAs: [
    "https://www.facebook.com/share/mfSUtXxwN4HnpaQW/",
    "https://www.instagram.com/daud_travel",
    "https://youtube.com/@daud_travel",
    "https://www.tiktok.com/@daud_travel",
    "https://t.me/daud_travel",
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "21:00",
  },
};

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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <Script id="whatsapp-widget" strategy="afterInteractive">
          {initWhatsAppWidget(CHAT_CONFIG.WHATSAPP_NUMBER)}
        </Script>

        <AuthProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <Toaster position="top-right" richColors closeButton />
              <Header />
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
