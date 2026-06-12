import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import { TransfersList } from "./_components/sections/TransfersList";
import { DriversSection } from "./_components/sections/DriversSection";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  const currentUrl = `${BASE_URL}/${locale}/transfers`;

  return {
    title: t("transfers"),
    description: t("descriptionTransfers"),
    keywords:
      "airport transfer Georgia, Tbilisi airport taxi, Batumi transfer, Kutaisi airport transport, private transfer Georgia, minivan transfer, sedan taxi Georgia, door-to-door transfer, book transfer online Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Transportation",
    alternates: {
      canonical: currentUrl,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/transfers`])
        ),
        "x-default": `${BASE_URL}/en/transfers`,
      },
    },
    openGraph: {
      title: t("transfers"),
      description: t("descriptionTransfers"),
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("transfers"),
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("transfers"),
      description: t("descriptionTransfers"),
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

export default function TransfersPage() {
  const transfersJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}/#transfer-service`,
    name: "Airport Transfers & Transportation in Georgia",
    description:
      "Reliable airport transfers and transportation services in Georgia. Book comfortable, safe vehicles with professional drivers.",
    provider: {
      "@type": "TravelAgency",
      "@id": `${BASE_URL}/#organization`,
      name: "Daud Travel",
      url: BASE_URL,
    },
    serviceType: "Transportation",
    areaServed: {
      "@type": "Country",
      name: "Georgia",
    },
    url: `${BASE_URL}/en/transfers`,
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${BASE_URL}/en/transfers`,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(transfersJsonLd) }}
      />
      <TransfersList />
      <DriversSection />
    </main>
  );
}
