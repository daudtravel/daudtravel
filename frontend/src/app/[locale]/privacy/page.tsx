import React from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Locale } from "@/src/i18n/routing";

const BASE_URL = "https://www.daudtravel.com";
const locales = ["ka", "en", "ru", "ar", "tr"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/privacy`])
        ),
        "x-default": `${BASE_URL}/en/privacy`,
      },
    },
    robots: { index: true, follow: true },
  };
}

const PrivacyPolicy = () => {
  const t = useTranslations("legal.privacy");

  // Renders legal.privacy.<section>.item1..itemN as list items
  const items = (section: string, count: number) =>
    Array.from({ length: count }, (_, i) => (
      <li key={i}>{t(`${section}.item${i + 1}`)}</li>
    ));

  const policyContent = [
    {
      title: t("collect.title"),
      content: (
        <>
          <p className="mb-4">{t("collect.p1")}</p>

          <p className="mb-2">{t("collect.providedTitle")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("collect", 3)}
          </ul>

          <p className="mb-2">{t("collect.paymentTitle")}</p>
          <p className="ms-6">{t("collect.paymentText")}</p>
        </>
      ),
    },
    {
      title: t("use.title"),
      content: (
        <>
          <p className="mb-4">{t("use.intro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2">
            {items("use", 5)}
          </ul>
        </>
      ),
    },
    {
      title: t("sharing.title"),
      content: (
        <>
          <p className="mb-4">{t("sharing.intro")}</p>
          <ol className="list-decimal list-inside ms-6 space-y-3 mb-4">
            {items("sharing", 2)}
          </ol>
        </>
      ),
    },
    {
      title: t("other.title"),
      content: (
        <>
          <p>{t("other.p1")}</p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8  ">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl mb-8 pb-4 border-b-2">
          {t("title")}
        </h1>

        <p className="mb-10 leading-relaxed bg-gray-50 p-5 rounded-lg">
          {t.rich("intro", {
            site: (chunks) => (
              <a
                href="https://www.daudtravel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="space-y-8">
          {policyContent.map((section, index) => (
            <div key={index} className="p-6 rounded-lg border">
              <h2 className="text-xl md:text-2xl mb-4 pb-3 border-b">
                {section.title}
              </h2>
              <div className="leading-relaxed">{section.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
