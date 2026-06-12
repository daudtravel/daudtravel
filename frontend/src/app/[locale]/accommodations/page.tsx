import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import AccommodationsList from "./_components/AccommodationsList";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("accommodations");
  const currentUrl = `${BASE_URL}/${locale}/accommodations`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords:
      "Georgia hotels, apartments Georgia, Batumi hotels, Tbilisi apartments, book hotel Georgia, vacation rentals Georgia, accommodation Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",
    alternates: {
      canonical: currentUrl,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/accommodations`])
        ),
        "x-default": `${BASE_URL}/en/accommodations`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("metaTitle"),
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${BASE_URL}/images/MainOG.jpg`],
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

export default function AccommodationsPage() {
  return <AccommodationsList />;
}
