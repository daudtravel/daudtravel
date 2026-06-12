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
        en: `${baseUrl}/en/contact`,
        ka: `${baseUrl}/ka/contact`,
        ru: `${baseUrl}/ru/contact`,
        tr: `${baseUrl}/tr/contact`,
        ar: `${baseUrl}/ar/contact`,
        "x-default": `${baseUrl}/en/contact`,
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

    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("contact"),
      description: t("descriptionContact"),
      images: [`${baseUrl}/images/MainOG.jpg`],
    },
  };

  return metadata;
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = "https://www.daudtravel.com";

  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${baseUrl}/${locale}/contact`,
    name: "Contact Daud Travel",
    url: `${baseUrl}/${locale}/contact`,
    mainEntity: {
      "@type": "TravelAgency",
      "@id": `${baseUrl}/#organization`,
      name: "Daud Travel",
      url: baseUrl,
      telephone: "+995557442212",
      email: "traveldaud@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "St.Chabua Amirejibi #4",
        addressLocality: "Batumi",
        addressCountry: "GE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "41.6443898",
        longitude: "41.6346718",
      },
      sameAs: [
        "https://www.facebook.com/share/mfSUtXxwN4HnpaQW/",
        "https://www.instagram.com/daud_travel",
        "https://youtube.com/@daud_travel",
      ],
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Contact", item: `${baseUrl}/${locale}/contact` },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ContactCard />
    </main>
  );
}
