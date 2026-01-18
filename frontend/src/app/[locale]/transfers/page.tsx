import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";
import { Drivers } from "./_components/Drivers";
import { TransferBooking } from "./_components/Transfers";

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
      locale: locale,
      url: "https://www.daudtravel.com/transfers",
      siteName: "Daud Travel",
    },
    icons: {
      icon: "/images/MainOG.jpg",
    },
  };
}

export default function Page() {
  return (
    <section className="py-10 md:pb-20 ">
      <TransferBooking />
      <Drivers />
    </section>
  );
}
