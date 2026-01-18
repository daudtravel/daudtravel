import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import ToursList from "./_components/ToursList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("meta");

  return {
    title: t("tours"),
    description: t("descriptionTours"),
    openGraph: {
      title: t("tours"),
      description: t("descriptionTours"),
      type: "website",
      locale,
      url: "https://www.daudtravel.com/tours",
      siteName: "Daud Travel",
    },
    icons: {
      icon: "/images/MainOG.jpg",
    },
  };
}

export default function ToursPage() {
  return <ToursList />;
}
