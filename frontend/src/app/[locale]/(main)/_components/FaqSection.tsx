"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { faqApi } from "@/src/services/faq.service";
import { getFAQ } from "@/src/types/faq.types";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function FaqSection() {
  const t = useTranslations("main");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const params = useParams();
  const locale = params.locale as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["faqs", locale],
    queryFn: () => faqApi.get(locale),
  });

  const faqs = data?.data || [];

  const handleClick = (value: string) => {
    setOpenItems((prevOpenItems) => ({
      ...prevOpenItems,
      [value]: !prevOpenItems[value],
    }));
  };

  const bgColor = (value: string) => (openItems[value] ? "#DFE6FC" : "#f2f5ff");

  if (isLoading) {
    return (
      <section className="bg-[#f2f5ff] w-full px-6 py-12 sm:px-16 md:px-20">
        <h1 className="text-xl">{t("faq")}</h1>
        <div className="mt-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-[#f2f5ff] w-full px-6 py-12 sm:px-16 md:px-20">
        <h1 className="text-xl">{t("faq")}</h1>
        <div className="mt-6 text-red-500">
          {t("error_loading_faqs", { defaultValue: "Error loading FAQs" })}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f2f5ff] w-full px-6 py-12 sm:px-16 md:px-20">
      <h1 className="text-xl">{t("faq")}</h1>
      {faqs.length === 0
        ? null
        : faqs.map((faq: getFAQ) => {
            const localization =
              faq.localizations.find((l) => l.locale === locale) ||
              faq.localizations[0];

            return (
              <Accordion
                key={faq.id}
                type="single"
                collapsible
                className="mt-6 w-full rounded-lg bg-gray-400"
              >
                <AccordionItem
                  value={faq.id}
                  style={{ backgroundColor: bgColor(faq.id) }}
                  className="rounded-lg bg-slate-500 border-2 w-full"
                >
                  <div
                    onClick={() => handleClick(faq.id)}
                    className="flex w-full flex-row items-center rounded-lg"
                  >
                    <div className="w-full">
                      <AccordionTrigger className="items-start justify-between text-left flex w-full text-[14px] font-semibold px-4">
                        {localization.question}
                      </AccordionTrigger>
                    </div>
                  </div>
                  <AccordionContent className="p-2 pt-0 text-left text-xs leading-5 md:pl-6">
                    {localization.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
    </section>
  );
}
