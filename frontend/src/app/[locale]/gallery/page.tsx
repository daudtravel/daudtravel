import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import GalleryClient from "./_components/GalleryClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("main");

  return {
    title: `${t("gallery")} | Daud Travel`,
    description: t("galleryDesc"),
  };
}

export default function Page() {
  return (
    <main className="w-full relative">
      <GalleryClient />
    </main>
  );
}
