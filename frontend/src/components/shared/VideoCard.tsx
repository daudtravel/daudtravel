"use client";

import dynamic from "next/dynamic";
import { Video, getVideoLocalization } from "@/src/types/video.types";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface VideoCardProps {
  video: Video;
  locale: string;
  showDescription?: boolean;
}

export function VideoCard({
  video,
  locale,
  showDescription = false,
}: VideoCardProps) {
  const { title, description } = getVideoLocalization(video, locale);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="w-full aspect-video bg-gray-900">
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
      {(title || (showDescription && description)) && (
        <div className="p-4 flex-1 flex flex-col gap-1">
          {title && (
            <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
          )}
          {showDescription && description && (
            <p className="text-xs md:text-sm text-gray-500 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
