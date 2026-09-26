"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

type ApiErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: { message?: string | string[]; statusCode?: number };
  };
};

/** Extracts the backend error code/message (Nest returns string or string[]). */
export function getApiErrorCode(error: unknown): string | null {
  const err = error as ApiErrorShape;
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? null;
  return typeof message === "string" ? message : null;
}

export function getApiStatus(error: unknown): number | null {
  return (error as ApiErrorShape)?.response?.status ?? null;
}

/**
 * Returns a function turning any API error into a translated, user-facing
 * message. Known backend codes (e.g. EMAIL_EXISTS) map to `admin.errors.*`;
 * validation messages fall back to a generic text.
 */
export function useApiErrorMessage() {
  const t = useTranslations("admin.errors");

  return useCallback(
    (error: unknown, fallbackKey: string = "generic") => {
      const code = getApiErrorCode(error);
      if (code && /^[A-Z][A-Z0-9_]+$/.test(code) && t.has(code)) {
        return t(code);
      }
      const status = getApiStatus(error);
      if (!status) return t("network");
      if (status === 403) return t("FORBIDDEN");
      if (status === 404) return t("NOT_FOUND");
      return t(fallbackKey);
    },
    [t]
  );
}

/** react-query retry policy: never retry client errors (4xx). */
export function adminRetry(failureCount: number, error: unknown) {
  const status = getApiStatus(error);
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 2;
}
