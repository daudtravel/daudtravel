/** Row shapes of the website-content admin lists. */

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
  mainImage: string;
  isPublic: boolean;
  createdAt: string;
  localizations: {
    locale: string;
    name: string;
    description: string;
    address: string;
  }[];
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
