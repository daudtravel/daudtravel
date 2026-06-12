import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AccommodationDetails from "./_components/AccommodationDetails";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getAccommodation(id: string, locale: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/accommodations/${id}?locale=${locale}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function extractPlainText(description?: string, max = 160): string {
  if (!description) return "";
  try {
    const parsed = JSON.parse(description);
    const text = parsed.blocks
      ?.map((block: { text: string }) => block.text)
      .join(" ")
      .trim()
      .slice(0, max);
    return text || "";
  } catch {
    return description.slice(0, max);
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const res = await getAccommodation(id, locale);
  const tAcc = await getTranslations("accommodations");

  if (!res) {
    return {
      title: "Accommodation Not Found",
      description: "The requested accommodation could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const data = res.data ?? res;
  const localization = data.localizations?.[0];
  const title = localization?.name?.trim() ?? "Accommodation";
  const description =
    extractPlainText(localization?.description) || tAcc("metaDescription");

  // Photo when available, brand logo otherwise
  const image = data.mainImage
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${data.mainImage}`
    : `${BASE_URL}/images/Logo.png`;

  const currentUrl = `${BASE_URL}/${locale}/accommodations/${id}`;

  return {
    title,
    description,
    keywords: [
      title,
      data.city,
      data.type === "HOTEL" ? "hotel Georgia" : "apartment Georgia",
      "Daud Travel",
      "accommodation Georgia",
    ]
      .filter(Boolean)
      .join(", "),
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    alternates: {
      canonical: currentUrl,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/accommodations/${id}`])
        ),
        "x-default": `${BASE_URL}/en/accommodations/${id}`,
      },
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
  const res = await getAccommodation(id, locale);
  const tAcc = await getTranslations("accommodations");
  const data = res?.data ?? res;
  const localization = data?.localizations?.[0];
  const title = localization?.name?.trim() ?? "Accommodation";
  const description =
    extractPlainText(localization?.description, 200) ||
    tAcc("metaDescription");

  const image = data?.mainImage
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${data.mainImage}`
    : `${BASE_URL}/images/Logo.png`;

  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": data.type === "APARTMENT" ? "Apartment" : "Hotel",
        "@id": `${BASE_URL}/${locale}/accommodations/${id}`,
        name: title,
        description,
        image,
        url: `${BASE_URL}/${locale}/accommodations/${id}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: data.city,
          addressCountry: "GE",
          ...(localization?.address && { streetAddress: localization.address }),
        },
        ...(data.maxGuests && { occupancy: { "@type": "QuantitativeValue", maxValue: data.maxGuests } }),
        ...(data.bedrooms && { numberOfBedrooms: data.bedrooms }),
        ...(data.price && {
          priceRange: `${data.price} GEL`,
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: "GEL",
            url: `${BASE_URL}/${locale}/accommodations/${id}`,
            availability: "https://schema.org/InStock",
          },
        }),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Accommodations",
        item: `${BASE_URL}/${locale}/accommodations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${BASE_URL}/${locale}/accommodations/${id}`,
      },
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AccommodationDetails />
    </>
  );
}
