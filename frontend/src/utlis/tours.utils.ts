import { Tour, TourType, TourLocalization } from "@/src/types/tours.type";

export function extractUniqueLocations(tours: Tour[]): string[] {
  const locationsSet = new Set<string>();

  tours.forEach((tour) => {
    tour.localizations.forEach((localization) => {
      if (localization.startLocation) {
        locationsSet.add(localization.startLocation);
      }
    });
  });

  return Array.from(locationsSet).sort();
}

export function getCurrentLocalization(
  tour: Tour,
  locale: string
): TourLocalization | undefined {
  return tour.localizations.find((loc) => loc.locale === locale);
}

export function isCurrentSeasonSummer(): boolean {
  const month = new Date().getMonth();
  return month >= 5 && month <= 8;
}

export function getTourDisplayPrice(tour: Tour): {
  originalPrice: number;
  discountedPrice?: number;
  currency: string;
} {
  if (tour.type === TourType.INDIVIDUAL && tour.individualPricing) {
    const isSummer = isCurrentSeasonSummer();
    return {
      originalPrice: isSummer
        ? tour.individualPricing.seasonTotalPrice
        : tour.individualPricing.offSeasonTotalPrice,
      discountedPrice: isSummer
        ? tour.individualPricing.seasonDiscountedPrice
        : tour.individualPricing.offSeasonDiscountedPrice,
      currency: "₾",
    };
  }

  if (tour.groupPricing) {
    return {
      originalPrice: tour.groupPricing.totalPrice,
      discountedPrice: tour.groupPricing.discountedPrice,
      currency: "$",
    };
  }

  return { originalPrice: 0, currency: "₾" };
}

export function formatTourDate(
  date: Date | string | undefined,
  locale: string
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale === "ar" ? "ar" : "en-CA");
}

export function hasTourAvailableSlots(tour: Tour): boolean {
  return tour.isPublic;
}

export function getTourTypeLabel(type: TourType): string {
  return type === TourType.INDIVIDUAL ? "individualTourType" : "groupTourType";
}
