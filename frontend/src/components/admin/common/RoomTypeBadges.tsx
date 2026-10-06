"use client";

import { sortRoomTypes } from "@/src/constants/roomTypes";
import { useRoomTypeLabel } from "@/src/hooks/useRoomTypeLabel";
import { cn } from "@/src/utlis/cn";

/** Read-only room types: predefined ones translated, hand-typed ones dashed. */
export default function RoomTypeBadges({
  roomTypes,
  customRoomTypes = [],
  emptyLabel,
  className,
}: {
  roomTypes: readonly string[];
  customRoomTypes?: readonly string[];
  /** Shown when there are none; nothing is rendered without it. */
  emptyLabel?: React.ReactNode;
  className?: string;
}) {
  const label = useRoomTypeLabel();
  const predefined = sortRoomTypes(roomTypes);

  if (!predefined.length && !customRoomTypes.length) {
    return emptyLabel ? (
      <p className={cn("text-sm text-gray-400", className)}>{emptyLabel}</p>
    ) : null;
  }

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {predefined.map((type) => (
        <li
          key={type}
          className="rounded-lg bg-brand-green-50 px-2.5 py-1 text-xs font-semibold text-brand-green print:border print:border-gray-300 print:bg-transparent print:text-black"
        >
          {label(type)}
        </li>
      ))}
      {customRoomTypes.map((name) => (
        <li
          key={`custom:${name}`}
          dir="auto"
          className="rounded-lg border border-dashed border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 print:text-black"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}
