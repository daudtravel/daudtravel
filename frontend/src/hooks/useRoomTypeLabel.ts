"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { isRoomType } from "@/src/constants/roomTypes";

/**
 * Label for a stored room type: predefined codes are translated
 * (accommodations.roomTypeLabels), anything else was typed by hand and is
 * shown as it is. Free text never goes through t().
 */
export function useRoomTypeLabel() {
  const t = useTranslations("accommodations");
  return useCallback(
    (value: string) =>
      isRoomType(value) ? t(`roomTypeLabels.${value}`) : value,
    [t]
  );
}
