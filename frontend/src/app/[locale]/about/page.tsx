import Image from "next/image";
import About1 from "@img/images/About1.jpg";
import About2 from "@img/images/About2.jpg";
import { Locale } from "@/src/i18n/routing";
import { getTranslations } from "next-intl/server";
import OwnerSection from "./_components/OwnerSection";
import { useTranslations, useLocale } from "next-intl";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");

  const baseUrl = "https://www.daudtravel.com";
  const currentUrl = `${baseUrl}/${locale}/about`;

  const metadata: Metadata = {
    title: t("about"),
    description: t("descriptionAbout"),
    keywords:
      "Daud Travel about, Georgia travel company, tourism company Georgia, travel agency Georgia, Georgian tour operator, experienced guides Georgia, travel services Georgia, tourism expertise Georgia",
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",
    category: "Travel",

    alternates: {
      canonical: currentUrl,
      languages: {
        en: `${baseUrl}/en`,
        ka: `${baseUrl}/ka`,
        ru: `${baseUrl}/ru`,
        tr: `${baseUrl}/tr`,
        ar: `${baseUrl}/ar`,
      },
    },

    openGraph: {
      title: t("about"),
      description: t("descriptionAbout"),
      type: "website",
      locale: locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: `${baseUrl}/images/About1.jpg`,
          width: 1200,
          height: 630,
          alt: t("about"),
          type: "image/jpeg",
        },
        {
          url: `${baseUrl}/images/About2.jpg`,
          width: 1200,
          height: 630,
          alt: "Daud Travel Team and Services",
          type: "image/jpeg",
        },
        {
          url: `${baseUrl}/images/MainOG.jpg`,
          width: 1200,
          height: 630,
          alt: "Daud Travel - Premium Tours in Georgia",
          type: "image/png",
        },
      ],
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

    other: {
      "article:author": "Daud Travel",
      "article:publisher": "Daud Travel",
      "og:image:alt": t("about"),
      "og:locale:alternate": locale === "en" ? "ka_GE" : "en_US",
    },
  };

  return metadata;
}

function Page() {
  const t = useTranslations("about");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  return (
    <div className="min-h-screen w-full pb-8 md:px-20 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            name: "Daud Travel",
            description: t("about1"),
            url: "https://www.daudtravel.com",
            logo: "https://www.daudtravel.com/images/MainOG.jpg",
            image: [
              "https://www.daudtravel.com/images/About1.jpg",
              "https://www.daudtravel.com/images/About2.jpg",
            ],
            address: {
              "@type": "PostalAddress",
              addressCountry: "GE",
              addressLocality: "Tbilisi",
            },
            areaServed: {
              "@type": "Country",
              name: "Georgia",
            },
            serviceType: [
              "Group Tours",
              "Individual Tours",
              "Airport Transfers",
              "Cultural Tours",
              "Wine Tours",
              "Nature Tours",
            ],
            priceRange: "$$",
            telephone: "+995-XXX-XXX-XXX",
            email: "info@daudtravel.com",
          }),
        }}
      />

      <div
        className={`flex flex-col w-full lg:flex-row gap-4 lg:items-start ${isRTL ? "lg:flex-row-reverse" : ""}`}
      >
        <div
          className={`w-full lg:w-2/3 space-y-8 ${isRTL ? "lg:pl-4" : "lg:pr-4"}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 w-full">
            <div className="relative h-80 sm:h-[400px] w-full border-2 border-[#f2f5ff] lg:rounded-lg overflow-hidden md:shadow-xl">
              <Image
                src={About1}
                alt="Daud Travel team providing premium tourism services in Georgia"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
            <div
              className={`relative hidden xl:flex ${isRTL ? "sm:left-10" : "sm:right-10"} sm:top-20 sm:z-10 border-2 border-[#f2f5ff] h-96 sm:h-[400px] w-full rounded-lg overflow-hidden shadow-xl`}
            >
              <Image
                src={About2}
                alt="Professional travel services and experienced guides in Georgia"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
        <div
          className={`w-full lg:w-1/2 lg:mt-0 px-4 md:px-0 ${isRTL ? "lg:text-right" : ""}`}
        >
          <h1 className="text-2xl sm:text-4xl h-16 font-bold text-center bg-clip-text text-transparent bg-mainGradient">
            {t("aboutUs")}
          </h1>

          <div className="space-y-4 w-full text-gray-700 mt-4 md:mt-8 lg:mt-10">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p
                className={`text-sm sm:text-base ${isRTL ? "text-right" : ""}`}
              >
                {t("about1")}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p
                className={`text-sm sm:text-base ${isRTL ? "text-right" : ""}`}
              >
                {t("about2")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <OwnerSection />
    </div>
  );
}

export default Page;
