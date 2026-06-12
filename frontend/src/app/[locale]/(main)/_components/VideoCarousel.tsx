// src/components/videos/VideoCarousel.tsx
"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/src/components/ui/carousel";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/src/i18n/routing";

import { videoApi } from "@/src/services/videos.service";
import { Video } from "@/src/types/video.types";
import { VideoCard } from "@/src/components/shared/VideoCard";

interface VideoCarouselProps {
  category?: string;
  startIndex?: number;
  endIndex?: number;
  showDescription?: boolean;
}

export default function VideoCarousel({
  category,
  startIndex = 0,
  endIndex,
  showDescription = false,
}: VideoCarouselProps) {
  const t = useTranslations("main");
  const params = useParams();
  const locale = params.locale as string;

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["videos", category],
    queryFn: () => videoApi.get(category),
    staleTime: 5 * 60 * 1000,
  });

  const videos: Video[] = response?.data || [];

  // Slice videos based on provided indices
  const displayVideos = endIndex
    ? videos.slice(startIndex, endIndex)
    : videos.slice(startIndex);

  // Return null if no videos to display
  if (displayVideos.length === 0 && !isLoading && !error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">
          {t("noVideosAvailable") || "No videos are currently available."}
        </p>
      </div>
    );
  }

  return (
    <section className="z-10 relative flex h-full w-full flex-col items-center pt-20 py-12 md:mt-12">
      <h2 className="absolute top-2 text-lg pt-4 text-center md:text-2xl tracking-widest font-semibold">
        {t("videoGallery")}
      </h2>
      <Carousel opts={{ loop: true }} className="mt-6 w-full">
        <CarouselContent className="w-full px-6 md:px-20 py-4">
          {displayVideos.map((video) => (
            <CarouselItem
              key={video.id}
              className="basis-[88%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4 px-2"
            >
              <VideoCard
                video={video}
                locale={locale}
                showDescription={showDescription}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block md:absolute -top-20 md:right-20 lg:right-40">
          <CarouselPrevious className="bg-brand-green text-brand-cream w-8 h-8 md:w-10 md:h-10 border-brand-green-mid rounded-md border hover:bg-brand-green-dark hover:text-brand-cream" />
          <CarouselNext className="bg-brand-green text-brand-cream w-8 h-8 md:w-10 md:h-10 border-brand-green-mid rounded-md border hover:bg-brand-green-dark hover:text-brand-cream" />
        </div>
      </Carousel>
      <Link
        href="/gallery"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-green-dark transition-colors"
      >
        {t("viewMore")}
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </section>
  );
}
