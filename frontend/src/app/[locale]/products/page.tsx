import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import AllProductsPage from "./_components/AllProductsPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");

  const baseUrl = "https://www.daudtravel.com";
  const currentUrl = `${baseUrl}/${locale}/products`;

  return {
    title: t("products"),
    description: t("descriptionProducts"),
    keywords:
      "buy Georgia tours, Georgia travel products, book tours Georgia, travel packages Georgia, tourism products Georgia, online travel booking Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",

    alternates: {
      canonical: currentUrl,
      languages: {
        en: `${baseUrl}/en/products`,
        ka: `${baseUrl}/ka/products`,
        ru: `${baseUrl}/ru/products`,
        tr: `${baseUrl}/tr/products`,
        ar: `${baseUrl}/ar/products`,
      },
    },

    openGraph: {
      title: t("products"),
      description: t("descriptionProducts"),
      type: "website",
      locale: locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${baseUrl}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("products"),
          type: "image/jpeg",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("products"),
      description: t("descriptionProducts"),
      images: [`${baseUrl}/images/MainOG.jpg`],
    },
  };
}

export default function page() {
  return <AllProductsPage />;
}
