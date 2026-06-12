import CoverSection from "./_components/CoverSection";
import WhyUsSection from "./_components/WhyUsSection";
import FaqSection from "./_components/FaqSection";
import Gallery from "./_components/Gallery";
import ReviewsSection from "./_components/ReviewsSection";
import TransferSection from "./_components/TransferSection";
import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Metadata } from "next";
import ToursCarouselSection from "./_components/ToursCarouselSection";
import { TourType } from "@/src/types/tours.type";
import VideoCarousel from "./_components/VideoCarousel";
import PublicProductsCarousel from "./_components/PublicProductsCarousel";
import InsuranceSection from "./_components/InsuranceSection";
import ServicesSection from "./_components/ServicesSection";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  const currentUrl = `${BASE_URL}/${locale}`;

  const metadata: Metadata = {
    title: t("main"),
    description: t("descriptionMain"),
    keywords: t("keywords"),
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",

    alternates: {
      canonical: currentUrl,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}`])
        ),
        "x-default": `${BASE_URL}/en`,
      },
    },

    openGraph: {
      title: t("main"),
      description: t("descriptionMain"),
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${BASE_URL}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: t("main"),
          type: "image/jpeg",
        },
        {
          url: `${BASE_URL}/images/MainOG-square.png`,
          width: 1080,
          height: 1080,
          alt: t("main"),
          type: "image/png",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@daudtravel",
      title: t("main"),
      description: t("descriptionMain"),
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

  return metadata;
}

// Static WebSite + SearchAction JSON-LD for the home page
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "Daud Travel",
  url: BASE_URL,
  description:
    "Leading travel agency in Georgia offering premium tours, transfers, and travel insurance.",
  publisher: {
    "@type": "TravelAgency",
    "@id": `${BASE_URL}/#organization`,
    name: "Daud Travel",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/en/tours?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  return (
    <main className="w-full relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <CoverSection />
      <ServicesSection />
      <ToursCarouselSection
        type={TourType.INDIVIDUAL}
        titleKey="individualTours"
      />
      <ToursCarouselSection type={TourType.GROUP} titleKey="groupTours" />
      <InsuranceSection />
      <PublicProductsCarousel />
      <WhyUsSection />
      <VideoCarousel startIndex={0} endIndex={10} showDescription={false} />
      <TransferSection />
      <Gallery />
      <ReviewsSection />
      <FaqSection />
      <VideoCarousel startIndex={10} showDescription={true} />
    </main>
  );
}
