import { Metadata } from "next";
import TransferDetailsClient from "./_components/TransferDetailsClient";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getTransfer(id: string, locale: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/transfers/${id}?locale=${locale}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const response = await getTransfer(id, locale);
  const transfer = response?.data;

  if (!transfer) {
    return {
      title: "Transfer Not Found",
      description: "The requested transfer could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const localization =
    transfer.localizations?.find(
      (l: { locale: string }) => l.locale === locale
    ) ?? transfer.localizations?.[0];

  const startLocation = localization?.startLocation ?? "Georgia";
  const endLocation = localization?.endLocation ?? "destination";
  const title = `Transfer: ${startLocation} → ${endLocation} | Daud Travel`;
  const description = `Book a comfortable transfer from ${startLocation} to ${endLocation} with Daud Travel. Professional drivers, modern vehicles, competitive prices.`;
  const currentUrl = `${BASE_URL}/${locale}/transfers/${id}`;

  return {
    title,
    description,
    keywords: `transfer ${startLocation} ${endLocation}, taxi Georgia, airport transfer, private transfer Georgia, Daud Travel transport`,
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}/transfers/${id}`])
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title,
      description,
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

export default async function TransferDetailsPage({ params }: PageProps) {
  const { id, locale } = await params;
  const response = await getTransfer(id, locale);
  const transfer = response?.data;
  const localization =
    transfer?.localizations?.find(
      (l: { locale: string }) => l.locale === locale
    ) ?? transfer?.localizations?.[0];

  const startLocation = localization?.startLocation ?? "";
  const endLocation = localization?.endLocation ?? "";
  const title = startLocation && endLocation
    ? `Transfer: ${startLocation} → ${endLocation}`
    : "Transfer Service";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Transfers",
        item: `${BASE_URL}/${locale}/transfers`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${BASE_URL}/${locale}/transfers/${id}`,
      },
    ],
  };

  const serviceJsonLd = transfer
    ? {
        "@context": "https://schema.org",
        "@type": "TaxiService",
        "@id": `${BASE_URL}/${locale}/transfers/${id}`,
        name: title,
        description: `Private transfer from ${startLocation} to ${endLocation} in Georgia`,
        provider: {
          "@type": "TravelAgency",
          "@id": `${BASE_URL}/#organization`,
          name: "Daud Travel",
          url: BASE_URL,
        },
        areaServed: {
          "@type": "Country",
          name: "Georgia",
        },
        url: `${BASE_URL}/${locale}/transfers/${id}`,
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {serviceJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      <TransferDetailsClient />
    </>
  );
}
