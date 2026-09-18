export const QUERY_KEYS = {
  TRANSFERS: "transfers",
  ADMIN: "admin",
  PUBLIC: "public",
  DETAIL: "detail",
  PAYMENT_STATUS: "paymentStatus",
} as const;

export const TRANSFERS_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
