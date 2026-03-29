import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import InsuranceSubmissionPage from "./_components/InsuranceSubmission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");

  const baseUrl = "https://www.daudtravel.com";
  const currentUrl = `${baseUrl}/${locale}/insurance`;

  return {
    title: t("insurance"),
    description: t("descriptionInsurance"),
    keywords:
      "travel insurance Georgia, tourist insurance Tbilisi, travel insurance online Georgia, Daud Travel insurance, affordable travel insurance, Georgia trip insurance",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel Insurance",

    alternates: {
      canonical: currentUrl,
      languages: {
        en: `${baseUrl}/en/insurance`,
        ka: `${baseUrl}/ka/insurance`,
        ru: `${baseUrl}/ru/insurance`,
        tr: `${baseUrl}/tr/insurance`,
        ar: `${baseUrl}/ar/insurance`,
      },
    },

    openGraph: {
      title: t("insurance"),
      description: t("descriptionInsurance"),
      type: "website",
      locale: locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${baseUrl}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("insurance"),
          type: "image/jpeg",
        },
      ],
    },

    other: {
      "og:image:alt": t("insurance"),
      "og:locale:alternate": locale === "en" ? "ka_GE" : "en_US",
    },
  };
}

export default function page() {
  return <InsuranceSubmissionPage />;
}
