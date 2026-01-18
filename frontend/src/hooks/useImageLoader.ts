import { useState, useCallback } from "react";

export const useImageLoader = () => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  }, []);

  const isImageLoaded = useCallback(
    (imageId: string) => {
      return loadedImages[imageId] || false;
    },
    [loadedImages]
  );

  return { handleImageLoad, isImageLoaded };
};
