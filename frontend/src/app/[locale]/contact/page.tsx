import { getTranslations } from "next-intl/server";
import ContactCard from "./_components/ContactCard";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");

  const baseUrl = "https://www.daudtravel.com";
  const currentUrl = `${baseUrl}/${locale}/contact`;

  const metadata: Metadata = {
    title: t("contact"),
    description: t("descriptionContact"),

    keywords:
      "contact Daud Travel, book Georgia tours, Georgia travel booking, travel agency contact, tourism company Georgia, travel consultation Georgia, Georgia tour booking online, travel support Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",

    alternates: {
      canonical: currentUrl,
      languages: {
        en: `${baseUrl}/en`,
        ka: `${baseUrl}/ka`,
        ru: `${baseUrl}/ru`,
        tr: `${baseUrl}/tr`,
        ar: `${baseUrl}/ar`,
      },
    },

    openGraph: {
      title: t("contact"),
      description: t("descriptionContact"),
      type: "website",
      locale: locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${baseUrl}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("contact"),
          type: "image/png",
        },
        {
          url: `${baseUrl}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: "Contact Daud Travel - Professional Travel Services in Georgia",
          type: "image/jpeg",
        },
      ],
    },

    // Robots
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

    // Icons
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
      other: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          url: "/favicon-16x16.png",
        },
      ],
    },

    // Additional structured data hints
    other: {
      "og:image:alt": t("contact"),
      "og:locale:alternate": locale === "en" ? "ka_GE" : "en_US",
    },
  };

  return metadata;
}

export default async function page() {
  return (
    <>
      <ContactCard />
    </>
  );
}
