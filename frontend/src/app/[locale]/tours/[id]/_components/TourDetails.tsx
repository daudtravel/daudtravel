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

  return (
    <PhotoProvider>
      <section className="w-full px-4 md:px-20 py-10 min-h-screen">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <MainImage data={processedData.mainImage} />
            <Description data={processedData.description} />
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <Gallery data={processedData.gallery} />
            <Payment data={tour} />
          </div>
        </div>
      </section>
    </PhotoProvider>
  );
};

export default TourDetails;
