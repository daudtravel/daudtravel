import { AccommodationType } from "../types/accommodations.type";

export const ACCOMMODATIONS_CONFIG = {
  ITEMS_PER_PAGE: 6,
  MAX_VISIBLE_PAGES: 5,
  STALE_TIME: 5 * 60 * 1000,
  CACHE_TIME: 30 * 60 * 1000,
} as const;

export const FILTER_DEFAULTS = {
  ALL_CITIES: "all",
  ALL_TYPES: "all",
} as const;

export const ACCOMMODATION_TYPE_LABELS = {
  [FILTER_DEFAULTS.ALL_TYPES]: "allTypes",
  [AccommodationType.HOTEL]: "hotel",
  [AccommodationType.APARTMENT]: "apartment",
} as const;

// Must stay in sync with AMENITY_KEYS in backend dto
export const AMENITY_KEYS = [
  "wifi",
  "parking",
  "pool",
  "breakfast",
  "ac",
  "kitchen",
  "tv",
  "washingMachine",
  "heating",
  "balcony",
  "seaView",
  "elevator",
  "petsAllowed",
  "gym",
] as const;

export type AmenityKey = (typeof AMENITY_KEYS)[number];

// WhatsApp / phone contact (same number as the contact page)
export const CONTACT = {
  WHATSAPP_NUMBER: "995557442212",
  PHONE: "+995557442212",
} as const;

export const QUERY_KEYS = {
  ACCOMMODATIONS: "accommodations",
  ACCOMMODATION_DETAIL: "accommodation-detail",
  ADMIN_ACCOMMODATIONS: "admin-accommodations",
} as const;
