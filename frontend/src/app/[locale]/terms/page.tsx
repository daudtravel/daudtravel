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
    title: t("termsTitle"),
    description: t("termsDescription"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/terms`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/terms`])
        ),
        "x-default": `${BASE_URL}/en/terms`,
      },
    },
    robots: { index: true, follow: true },
  };
}

const TermsAndConditions = () => {
  const t = useTranslations("legal.terms");

  // Renders legal.terms.<section>.item1..itemN as list items
  const items = (section: string, count: number) =>
    Array.from({ length: count }, (_, i) => (
      <li key={i}>{t(`${section}.item${i + 1}`)}</li>
    ));

  const termsContent = [
    {
      title: t("general.title"),
      content: (
        <>
          <p className="mb-4">{t("general.p1")}</p>
          <p>{t("general.p2")}</p>
        </>
      ),
    },
    {
      title: t("booking.title"),
      content: (
        <>
          <p className="mb-4">{t("booking.intro")}</p>

          <p className="mb-2 ms-6">{t("booking.option1Title")}</p>
          <p className="mb-4 ms-12">{t("booking.option1Text")}</p>

          <p className="mb-2 ms-6">{t("booking.option2Title")}</p>
          <p className="mb-4 ms-12">{t("booking.option2Text")}</p>

          <p className="mb-4">{t("booking.p1")}</p>

          <p>{t("booking.p2")}</p>
        </>
      ),
    },
    {
      title: t("tourDetails.title"),
      content: (
        <>
          <p className="mb-4">{t("tourDetails.intro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2">
            {items("tourDetails", 7)}
          </ul>
          <p className="mt-4">{t("tourDetails.outro")}</p>
        </>
      ),
    },
    {
      title: t("changes.title"),
      content: (
        <>
          <p className="mb-4">{t("changes.p1")}</p>
          <p className="mb-4">{t("changes.listIntro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("changes", 4)}
          </ul>
          <p className="mb-4">{t("changes.p2")}</p>
          <p>{t("changes.p3")}</p>
        </>
      ),
    },
    {
      title: t("cancellation.title"),
      content: (
        <>
          <p className="mb-4">{t("cancellation.p1")}</p>
          <p className="mb-4">{t("cancellation.p2")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("cancellation", 4)}
          </ul>
          <p className="mb-4">{t("cancellation.p3")}</p>
          <p>{t("cancellation.p4")}</p>
        </>
      ),
    },
    {
      title: t("clientResponsibility.title"),
      content: (
        <>
          <p className="mb-4">{t("clientResponsibility.intro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("clientResponsibility", 6)}
          </ul>
          <p>{t("clientResponsibility.outro")}</p>
        </>
      ),
    },
    {
      title: t("liability.title"),
      content: (
        <>
          <p className="mb-4">{t("liability.intro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("liability", 4)}
          </ul>
          <p>{t("liability.outro")}</p>
        </>
      ),
    },
    {
      title: t("contact.title"),
      content: (
        <>
          <p className="mb-4">{t("contact.intro")}</p>
          <ul className="list-disc list-inside ms-6 space-y-2 mb-4">
            {items("contact", 3)}
          </ul>
          <p>{t("contact.outro")}</p>
        </>
      ),
    },
    {
      title: t("changesToTerms.title"),
      content: (
        <>
          <p className="mb-4">{t("changesToTerms.p1")}</p>
          <p>{t("changesToTerms.p2")}</p>
        </>
      ),
    },
    {
      title: t("language.title"),
      content: (
        <>
          <p>{t("language.p1")}</p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
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
          {termsContent.map((section, index) => (
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

export default TermsAndConditions;
