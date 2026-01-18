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

export const TRANSFER_MESSAGES = {
  CREATE_SUCCESS: "Transfer created successfully",
  UPDATE_SUCCESS: "Transfer updated successfully",
  DELETE_SUCCESS: "Transfer deleted successfully",
  DELETE_ERROR: "Cannot delete transfer with existing payment orders",
  LOAD_ERROR: "Failed to load transfer",
  GENERIC_ERROR: "An unexpected error occurred",
} as const;
