import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { TransfersList } from "./_components/sections/TransfersList";
import { DriversSection } from "./_components/sections/DriversSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("meta");
  return {
    title: t("transfers"),
    description: t("descriptionTransfers"),
    openGraph: {
      title: t("transfers"),
      description: t("descriptionTransfers"),
      type: "website",
      locale,
      url: "https://www.daudtravel.com/transfers",
      siteName: "Daud Travel",
    },
    icons: { icon: "/images/MainOG.jpg" },
  };
}

export default function TransfersPage() {
  return (
    <main>
      <TransfersList />
      <DriversSection />
    </main>
  );
}
