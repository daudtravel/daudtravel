"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/src/utlis/cn";
import { imageUrl } from "@/src/utlis/admin/media";

/** List thumbnail with a neutral placeholder when the image is missing. */
export default function Thumb({
  src,
  alt = "",
  className,
  sizes = "56px",
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(src);

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300",
        className
      )}
    >
      {url && !failed ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff className="h-4 w-4" />
      )}
    </span>
  );
}
