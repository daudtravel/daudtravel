import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import ToursList from "./_components/ToursList";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  const currentUrl = `${BASE_URL}/${locale}/tours`;

  return {
    title: t("tours"),
    description: t("descriptionTours"),
    keywords:
      "Georgia tours, group tours Georgia, individual tours Georgia, Tbilisi tours, Batumi tours, Svaneti, Kakheti wine tours, cultural tours Georgia, adventure tours Caucasus, book tour Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}/tours`])
      ),
    },
    openGraph: {
      title: t("tours"),
      description: t("descriptionTours"),
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("tours"),
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("tours"),
      description: t("descriptionTours"),
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

export default function ToursPage() {
  return <ToursList />;
}
