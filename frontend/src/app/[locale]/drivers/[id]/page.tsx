import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DriverProfile from "./_components/DriverProfile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("driverProfile"),
    robots: { index: false, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="w-full relative">
      <DriverProfile driverId={id} />
    </main>
  );
}
