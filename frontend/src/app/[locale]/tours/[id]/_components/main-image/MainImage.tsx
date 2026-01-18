import { useImageLoader } from "@/src/hooks/useImageLoader";
import Image from "next/image";
import React from "react";
import { PhotoView } from "react-photo-view";
 

interface MainImageProps {
  data: {
    src: string;
    alt: string;
  };
}

const MainImage = React.memo<MainImageProps>(({ data }) => {
  const { handleImageLoad, isImageLoaded } = useImageLoader();
  const imageLoaded = isImageLoaded(data.src);

  return (
    <div className="w-full h-[250px] md:h-[400px] rounded-lg overflow-hidden">
      <PhotoView src={data.src}>
        <div className="relative w-full h-full">
          {!imageLoaded && (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
          )}
          <Image
            src={data.src || "/placeholder.svg"}
            alt={data.alt}
            fill
            priority
            className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => handleImageLoad(data.src)}
          />
        </div>
      </PhotoView>
    </div>
  );
});

MainImage.displayName = "MainImage";

export default MainImage;
