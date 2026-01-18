// src/components/videos/VideoCarousel.tsx
"use client";

import { CardContent } from "@/src/components/ui/card";
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
import { Loader2 } from "lucide-react";

import dynamic from "next/dynamic";
import { videoApi } from "@/src/services/videos.service";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type Video = {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
};

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
    queryKey: ["videos", locale, category],
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
      <h1 className="absolute top-2 text-lg pt-4 text-center md:text-2xl tracking-widest font-semibold">
        {t("videoGallery")}
      </h1>
      <Carousel opts={{ loop: true }} className="mt-6 w-full">
        <CarouselContent className="w-full px-6 md:px-20">
          {displayVideos.map((video) => (
            <CarouselItem
              key={video.id}
              className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-0"
            >
              <CardContent className="flex flex-col items-center justify-center px-4">
                <div className="w-full aspect-video rounded-lg shadow-lg overflow-hidden">
                  <ReactPlayer
                    url={video.url}
                    width="100%"
                    height="100%"
                    controls
                    light={true}
                    config={{
                      youtube: {
                        playerVars: { showinfo: 1 },
                      },
                    }}
                  />
                </div>
                {video.title && (
                  <p className="mt-2 text-sm font-medium text-center line-clamp-2">
                    {video.title}
                  </p>
                )}
                {showDescription && video.description && (
                  <p className="mt-1 text-xs text-gray-500 text-center line-clamp-2">
                    {video.description}
                  </p>
                )}
              </CardContent>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block md:absolute -top-20 md:right-20 lg:right-40">
          <CarouselPrevious className="bg-mainGradient text-white w-8 h-8 md:w-10 md:h-10 border-white rounded-md border hover:bg-mainGradientHover hover:text-white" />
          <CarouselNext className="bg-mainGradient text-white w-8 h-8 md:w-10 md:h-10 border-white rounded-md border hover:bg-mainGradientHover hover:text-white" />
        </div>
      </Carousel>
    </section>
  );
}
