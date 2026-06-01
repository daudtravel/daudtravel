import TourDetails from "./_components/TourDetails";
import { Metadata } from "next";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getTour(id: string, locale: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tours/${id}?locale=${locale}`;

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
  const tour = await getTour(id, locale);

  if (!tour) {
    return {
      title: "Tour Not Found",
      description: "The requested tour could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const tourData = tour.data ?? tour;
  const localization = tourData.localizations?.[0];

  const title = localization?.name?.trim() ?? "Tour Details";

  let description = "Explore this amazing tour with Daud Travel in Georgia.";
  if (localization?.description) {
    try {
      const parsed = JSON.parse(localization.description);
      const plainText = parsed.blocks
        ?.map((block: { text: string }) => block.text)
        .join(" ")
        .trim()
        .slice(0, 160);
      if (plainText) description = plainText;
    } catch {
      description = localization.description.slice(0, 160);
    }
  }

  const imagePath = tourData.mainImage ?? tourData.images?.[0];
  const image = imagePath
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${imagePath}`
    : `${BASE_URL}/images/MainOG.jpg`;

  const currentUrl = `${BASE_URL}/${locale}/tours/${id}`;
  const startLocation = localization?.startLocation ?? "Georgia";
  const locations: string[] = localization?.locations ?? [];

  const keywords = [
    title,
    "Georgia tour",
    startLocation,
    ...locations.slice(0, 3),
    "Daud Travel",
    "book tour Georgia",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}/tours/${id}`])
      ),
    },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
    },
    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title,
      description,
      images: [image],
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

export default async function Page({ params }: PageProps) {
  const { id, locale } = await params;
  const tour = await getTour(id, locale);
  const tourData = tour?.data ?? tour;
  const localization = tourData?.localizations?.[0];
  const title = localization?.name?.trim() ?? "Tour";

  let description = "Explore this amazing tour with Daud Travel in Georgia.";
  if (localization?.description) {
    try {
      const parsed = JSON.parse(localization.description);
      const plainText = parsed.blocks
        ?.map((block: { text: string }) => block.text)
        .join(" ")
        .trim()
        .slice(0, 200);
      if (plainText) description = plainText;
    } catch {
      description = localization.description.slice(0, 200);
    }
  }

  const imagePath = tourData?.mainImage ?? tourData?.images?.[0];
  const image = imagePath
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${imagePath}`
    : `${BASE_URL}/images/MainOG.jpg`;

  const startLocation = localization?.startLocation ?? "Georgia";
  const locations: string[] = localization?.locations ?? [];

  const tourJsonLd = tourData
    ? {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "@id": `${BASE_URL}/${locale}/tours/${id}`,
        name: title,
        description,
        image,
        url: `${BASE_URL}/${locale}/tours/${id}`,
        provider: {
          "@type": "TravelAgency",
          "@id": "https://www.daudtravel.com/#organization",
          name: "Daud Travel",
          url: "https://www.daudtravel.com",
        },
        touristType: tourData.type === "GROUP" ? "GroupTourists" : "FamilyPersons",
        itinerary: {
          "@type": "ItemList",
          itemListElement: [startLocation, ...locations]
            .filter(Boolean)
            .map((loc: string, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              name: loc,
            })),
        },
        ...(tourData.days && {
          duration: `P${tourData.days}D`,
        }),
        ...(tourData.groupPricing?.totalPrice && {
          offers: {
            "@type": "Offer",
            price: tourData.groupPricing.totalPrice,
            priceCurrency: "GEL",
            url: `${BASE_URL}/${locale}/tours/${id}`,
            availability: "https://schema.org/InStock",
          },
        }),
        ...(tourData.individualPricing?.seasonTotalPrice && {
          offers: {
            "@type": "Offer",
            price: tourData.individualPricing.seasonTotalPrice,
            priceCurrency: "GEL",
            url: `${BASE_URL}/${locale}/tours/${id}`,
            availability: "https://schema.org/InStock",
          },
        }),
      }
    : null;

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
        name: "Tours",
        item: `${BASE_URL}/${locale}/tours`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${BASE_URL}/${locale}/tours/${id}`,
      },
    ],
  };

  return (
    <>
      {tourJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tourJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TourDetails />
    </>
  );
}
