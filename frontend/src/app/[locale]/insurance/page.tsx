import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import InsuranceSubmissionPage from "./_components/InsuranceSubmission";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  const currentUrl = `${BASE_URL}/${locale}/insurance`;

  return {
    title: t("insurance"),
    description: t("descriptionInsurance"),
    keywords:
      "travel insurance Georgia, tourist insurance Tbilisi, travel insurance online Georgia, Daud Travel insurance, affordable travel insurance, Georgia trip insurance, visa insurance Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel Insurance",

    alternates: {
      canonical: currentUrl,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/insurance`])
        ),
        "x-default": `${BASE_URL}/en/insurance`,
      },
    },

    openGraph: {
      title: t("insurance"),
      description: t("descriptionInsurance"),
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("insurance"),
          type: "image/jpeg",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("insurance"),
      description: t("descriptionInsurance"),
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

export default function InsurancePage() {
  const insuranceJsonLd = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    "@id": `${BASE_URL}/#insurance`,
    name: "Daud Travel Insurance",
    description:
      "Travel insurance online with Daud Travel. Quick registration and instant document delivery. Coverage starting from 7 days.",
    provider: {
      "@type": "TravelAgency",
      "@id": `${BASE_URL}/#organization`,
      name: "Daud Travel",
      url: BASE_URL,
    },
    url: `${BASE_URL}/en/insurance`,
    areaServed: {
      "@type": "Country",
      name: "Georgia",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(insuranceJsonLd) }}
      />
      <InsuranceSubmissionPage />
    </main>
  );
}
