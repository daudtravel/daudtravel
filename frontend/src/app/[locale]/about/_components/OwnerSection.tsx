import React from "react";
import Image from "next/image";
import img from "@img/images/About3.jpg";
import { useTranslations, useLocale } from "next-intl";

const OwnerSection = () => {
  const t = useTranslations("about");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  return (
    <div className="mt-24 w-full">
      <div
        className={`flex flex-col lg:flex-row items-start gap-8 px-4 md:px-0 ${isRTL ? "lg:flex-row-reverse" : ""}`}
      >
        <div className="w-full lg:w-1/3">
          <div className="relative h-[400px] w-full border-2 border-[#f2f5ff] rounded-lg overflow-hidden shadow-xl">
            <Image
              src={img}
              alt="Davit Bolkvadze"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>

        <div
          className={`w-full lg:w-2/3 space-y-6 ${isRTL ? "lg:text-right" : ""}`}
        >
          <h2
            className={`text-2xl sm:text-3xl h-12 font-bold text-center ${isRTL ? "lg:text-right" : "lg:text-left"} bg-clip-text text-transparent bg-mainGradient`}
          >
            {t("founder")}
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3
                className={`font-semibold text-lg text-gray-800 mb-2 ${isRTL ? "text-right" : ""}`}
              >
                {t("education")}
              </h3>
              <p
                className={`text-sm sm:text-base text-gray-700 ${isRTL ? "text-right" : ""}`}
              >
                {t("aboutEducation")}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3
                className={`font-semibold text-lg text-gray-800 mb-2 ${isRTL ? "text-right" : ""}`}
              >
                {t("work")}
              </h3>
              <p
                className={`text-sm sm:text-base text-gray-700 ${isRTL ? "text-right" : ""}`}
              >
                {t("aboutExperience")}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3
                className={`font-semibold text-lg text-gray-800 mb-2 ${isRTL ? "text-right" : ""}`}
              >
                {t("languages")}
              </h3>
              <p
                className={`text-sm sm:text-base text-gray-700 ${isRTL ? "text-right" : ""}`}
              >
                {t("aboutLanguage")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSection;
