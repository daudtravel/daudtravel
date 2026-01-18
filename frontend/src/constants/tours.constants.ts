import { TourType } from "../types/tours.type";

export const TOURS_CONFIG = {
  ITEMS_PER_PAGE: 6,
  MAX_VISIBLE_PAGES: 5,
  STALE_TIME: 5 * 60 * 1000,
  CACHE_TIME: 30 * 60 * 1000,
} as const;

export const FILTER_DEFAULTS = {
  ALL_LOCATIONS: "all",
  ALL_TYPES: "all",
} as const;

export const TOUR_TYPE_LABELS = {
  [FILTER_DEFAULTS.ALL_TYPES]: "allTourTypes",
  [TourType.GROUP]: "groupTourType",
  [TourType.INDIVIDUAL]: "individualTourType",
} as const;

export const QUERY_KEYS = {
  ADMIN: "admin",
  TOURS: "tours",
  TOUR_DETAIL: "tour-detail",
  FILTER_OPTIONS: "filter-options",
  ADMIN_TOURS: "admin-tours",
} as const;
