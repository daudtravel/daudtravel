"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Camera, Clapperboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { videoApi } from "@/src/services/videos.service";
import { Video } from "@/src/types/video.types";
import { VideoCard } from "@/src/components/shared/VideoCard";

import Carting from "@img/images/Carting.jpg";
import Piaza from "@img/images/Piaza.jpg";
import Bicy from "@img/images/Bicy.jpg";
import Boat from "@img/images/Boat.jpg";
import Family from "@img/images/Family.jpg";
import Svaneti from "@img/images/Svaneti.jpg";
import Batumi from "@img/images/Batumi.jpg";
import River from "@img/images/River.jpg";

const PHOTOS: { img: StaticImageData; alt: string }[] = [
  { img: Svaneti, alt: "Svaneti mountains in Georgia" },
  { img: Batumi, alt: "Batumi city views" },
  { img: Carting, alt: "Karting adventure activity in Georgia" },
  { img: Piaza, alt: "Piazza and old town sights in Georgia" },
  { img: Bicy, alt: "Cycling tour through Georgian landscapes" },
  { img: Family, alt: "Family travel experience in Georgia" },
  { img: Boat, alt: "Boat trip on Georgian lakes and rivers" },
  { img: River, alt: "River landscape in Georgia" },
];

type Tab = "photos" | "videos";

export default function GalleryClient() {
  const t = useTranslations("main");
  const params = useParams();
  const locale = params.locale as string;
  const [tab, setTab] = useState<Tab>("photos");
  const [lightbox, setLightbox] = useState<{
    img: StaticImageData;
    alt: string;
  } | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => videoApi.get(),
    staleTime: 5 * 60 * 1000,
    enabled: tab === "videos",
  });

  const videos: Video[] = response?.data || [];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "photos", label: t("photos"), icon: <Camera className="h-4 w-4" /> },
    {
      key: "videos",
      label: t("videos"),
      icon: <Clapperboard className="h-4 w-4" />,
    },
  ];

  return (
    <div className="bg-brand-green-50 min-h-screen px-4 md:px-20 py-10 md:py-14">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-widest text-gray-900">
          {t("gallery")}
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          {t("galleryDesc")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-full p-1 shadow-md">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-brand-green text-white shadow"
                  : "text-gray-500 hover:text-brand-green"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      {tab === "photos" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {PHOTOS.map((photo) => (
            <button
              key={photo.alt}
              type="button"
              onClick={() => setLightbox(photo)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md border-2 border-transparent hover:border-brand-green transition-colors group"
            >
              <Image
                src={photo.img}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      )}

      {/* Videos */}
      {tab === "videos" &&
        (isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green-mid" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            {t("noVideosAvailable")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                locale={locale}
                showDescription
              />
            ))}
          </div>
        ))}

      {/* Photo lightbox */}
      <Dialog
        open={!!lightbox}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-w-4xl p-2 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">{t("photos")}</DialogTitle>
          {lightbox && (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={lightbox.img}
                alt={lightbox.alt}
                fill
                className="object-contain rounded-xl"
                sizes="100vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
