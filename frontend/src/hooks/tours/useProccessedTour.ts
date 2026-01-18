import { useMemo } from "react";
import type { Tour } from "@/src/types/tours.type";
import {
  NormalizedPricing,
  ProcessedTourData,
} from "@/src/app/[locale]/tours/[id]/_components/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

const normalizePricing = (tour: Tour): NormalizedPricing => {
  const individualPricing = tour.individualPricing
    ? {
        ...tour.individualPricing,
        seasonTotalPrice: Number(tour.individualPricing.seasonTotalPrice) || 0,
        seasonDiscountedPrice:
          Number(tour.individualPricing.seasonDiscountedPrice) || 0,
        seasonReservationPrice:
          Number(tour.individualPricing.seasonReservationPrice) || 0,
        offSeasonTotalPrice:
          Number(tour.individualPricing.offSeasonTotalPrice) || 0,
        offSeasonDiscountedPrice:
          Number(tour.individualPricing.offSeasonDiscountedPrice) || 0,
        offSeasonReservationPrice:
          Number(tour.individualPricing.offSeasonReservationPrice) || 0,
      }
    : undefined;

  const groupPricing = tour.groupPricing
    ? {
        ...tour.groupPricing,
        totalPrice: Number(tour.groupPricing.totalPrice) || 0,
        discountedPrice: Number(tour.groupPricing.discountedPrice) || 0,
        reservationPrice: Number(tour.groupPricing.reservationPrice) || 0,
      }
    : undefined;

  return { individualPricing, groupPricing };
};

const processLocations = (localization: any) => {
  const locations = localization.locations || [];
  const startLocation = localization.startLocation;
  const endLocation =
    locations.length > 0 ? locations[locations.length - 1] : startLocation;
  const allDestinations = [startLocation, ...locations].filter(Boolean);

  return { locations, startLocation, endLocation, allDestinations };
};

const processGalleryImages = (tour: Tour) => {
  const baseImageUrl = `${API_BASE_URL}${tour.mainImage}`;
  const galleryImages = (tour.images || [])
    .filter((img) => img.url !== tour.mainImage)
    .map((img) => `${API_BASE_URL}${img.url}`);

  return { baseImageUrl, galleryImages };
};

/**
 * Process raw tour data into structured format for different components
 */
export const useProcessedTour = (
  tour: Tour | undefined
): ProcessedTourData | null => {
  return useMemo(() => {
    if (!tour) return null;

    const localization = tour.localizations?.[0];
    if (!localization) return null;

    const { locations, startLocation, endLocation, allDestinations } =
      processLocations(localization);

    const { baseImageUrl, galleryImages } = processGalleryImages(tour);

    const { individualPricing, groupPricing } = normalizePricing(tour);

    return {
      mainImage: {
        src: baseImageUrl,
        alt: localization.name || "Tour main view",
      },
      description: {
        name: localization.name,
        description: localization.description,
        startLocation,
        endLocation,
        locations,
        allDestinations,
        days: tour.days,
        nights: tour.nights,
        maxPersons: tour.maxPersons,
        type: tour.type,
        isDaily: tour.isDaily,
        startDate: tour.startDate,
        individualPricing,
        groupPricing,
      },
      gallery: {
        images: galleryImages,
        mainImageSrc: tour.mainImage,
      },
      payment: {
        id: tour.id,

        type: tour.type,
        individualPricing,
        groupPricing,
        name: localization.name,
        description: localization.description,
        startLocation,
        endLocation,
        locations,
        allDestinations,
        days: tour.days,
        nights: tour.nights,
        maxPersons: tour.maxPersons,
        isDaily: tour.isDaily,
        startDate: tour.startDate,
        mainImage: tour.mainImage,
        images: tour.images || [],
        tourName: localization.name,
      },
    };
  }, [tour]);
};
