/** Row shapes of the website-content admin lists. */

import type { RoomType } from "@/src/constants/roomTypes";

export interface Localization {
  locale: string;
  [key: string]: unknown;
}

export interface AdminTourRow {
  id: string;
  type: "GROUP" | "INDIVIDUAL";
  days: number;
  nights: number;
  maxPersons: number | null;
  startDate: string | null;
  isPublic: boolean;
  isDaily: boolean;
  mainImage: string;
  createdAt: string;
  updatedAt: string;
  localizations: {
    locale: string;
    name: string;
    description: string;
    startLocation: string;
    locations: string[];
  }[];
  groupPricing?: {
    totalPrice: string | number;
    reservationPrice: string | number;
    discountedPrice: string | number | null;
  } | null;
  individualPricing?: {
    seasonTotalPrice: string | number;
    offSeasonTotalPrice: string | number;
  } | null;
}

export interface AdminTransferRow {
  id: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  localizations: {
    locale: string;
    startLocation: string;
    endLocation: string;
  }[];
  vehicleTypes: {
    id: string;
    type: string;
    price: number;
    maxPersons: number;
  }[];
}

export interface AdminAccommodationRow {
  id: string;
  type: "HOTEL" | "APARTMENT";
  price: string | number;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  roomTypes?: RoomType[];
  mainImage: string;
  isPublic: boolean;
  createdAt: string;
  localizations: {
    locale: string;
    name: string;
    description: string;
    address: string;
    customRoomTypes?: string[];
  }[];
  /**
   * The hotel-directory entry filled from this listing, if any; its id is
   * null when the user may not open that entry.
   */
  hotel?: { id: string | null } | null;
}

/**
 * A website listing as offered by the hotel form's picker
 * (GET /accommodations/options — published and hidden ones alike).
 */
export interface ListingOption {
  id: string;
  type: "HOTEL" | "APARTMENT";
  city: string;
  /** GEL per night. */
  price: number;
  mainImage: string;
  isPublic: boolean;
  roomTypes: RoomType[];
  localizations: {
    locale: string;
    name: string;
    address: string;
    customRoomTypes: string[];
  }[];
  /** Whether a directory entry is already filled from this listing. */
  linked: boolean;
  /** That entry, when the user may open it (null otherwise). */
  hotelId: string | null;
}

export interface AdminFaqRow {
  id: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  localizations: { locale: string; question: string; answer: string }[];
}

export interface AdminVideoRow {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  createdAt: string;
  localizations?: {
    locale: string;
    title: string;
    description?: string | null;
  }[];
}

export interface AdminPaymentLinkRow {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image: string | null;
  price: number;
  isActive: boolean;
  showOnWebsite: boolean;
  paidOrdersCount: number;
  paymentLink: string;
  createdAt: string;
  localizations?: {
    locale: string;
    name: string;
    description?: string | null;
  }[];
}

/** Picks the best localization: current locale → ka → en → first available. */
export function pickLocalization<T extends { locale: string }>(
  localizations: T[] | undefined,
  locale: string
): T | undefined {
  if (!localizations?.length) return undefined;
  return (
    localizations.find((l) => l.locale === locale) ??
    localizations.find((l) => l.locale === "ka") ??
    localizations.find((l) => l.locale === "en") ??
    localizations[0]
  );
}
