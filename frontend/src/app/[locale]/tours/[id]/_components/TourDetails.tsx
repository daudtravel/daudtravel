"use client";

import type React from "react";
import { Card } from "@/src/components/ui/card";
import { PhotoProvider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useParams } from "next/navigation";
import ToursSectionLoader from "@/src/components/shared/loader/ToursSectionLoader";
import Description from "./description/Description";
import Gallery from "./gallery/Gallery";
import Payment from "./payment/Payment";
import MainImage from "./main-image/MainImage";

import { useTourData } from "@/src/hooks/tours/useTourData";
import { useProcessedTour } from "@/src/hooks/tours/useProccessedTour";
import { useTranslations, useLocale } from "next-intl";
import { Clock, MapPin, User, Users } from "lucide-react";

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="max-w-7xl mx-auto p-4 sm:p-6">
    <Card className="p-6 bg-red-50 border-red-200">
      <p className="text-red-500 text-center">{message}</p>
    </Card>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-full min-h-screen mx-auto p-4 sm:p-6">
    <Card className="p-6">
      <p className="text-gray-500 text-center">{message}</p>
    </Card>
  </div>
);

const TourDetails: React.FC = () => {
  const params = useParams();
  const t = useTranslations("tours");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  const id = params.id as string;
  const locale = params.locale as string;

  const { tour, isLoading, error } = useTourData({ id, locale });
  const processedData = useProcessedTour(tour);

  if (isLoading) {
    return <ToursSectionLoader />;
  }

  if (error) {
    return (
      <ErrorState message="Error loading tour data. Please try again later." />
    );
  }

  if (!tour || !processedData) {
    return <EmptyState message="No tour data available" />;
  }

  const { description } = processedData;
  const TypeIcon = description.type === "INDIVIDUAL" ? User : Users;

  return (
    <PhotoProvider>
      <section className="w-full px-4 md:px-20 py-10 min-h-screen">
        <header className="mb-6 md:mb-8" dir={isRTL ? "rtl" : "ltr"}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {description.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-brand-green text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <TypeIcon className="w-3.5 h-3.5" />
              {description.type === "INDIVIDUAL"
                ? t("individualTourType")
                : t("groupTourType")}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-brand-green-50 text-brand-green text-xs font-medium px-3 py-1.5 rounded-full border border-brand-green-100">
              <Clock className="w-3.5 h-3.5" />
              {description.days} {t("day")}
              {description.nights > 0 &&
                ` / ${description.nights} ${t("night")}`}
            </span>
            {description.startLocation && (
              <span className="inline-flex items-center gap-1.5 bg-brand-green-50 text-brand-green text-xs font-medium px-3 py-1.5 rounded-full border border-brand-green-100">
                <MapPin className="w-3.5 h-3.5" />
                {description.startLocation}
              </span>
            )}
          </div>
        </header>
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <MainImage data={processedData.mainImage} />
            <Description data={processedData.description} />
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <Gallery data={processedData.gallery} tourName={processedData.description.name} />
            <Payment data={tour} />
          </div>
        </div>
      </section>
    </PhotoProvider>
  );
};

export default TourDetails;
