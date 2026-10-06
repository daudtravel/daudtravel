"use client";

import { Check } from "lucide-react";
import {
  ROOM_TYPES,
  sortRoomTypes,
  type RoomType,
} from "@/src/constants/roomTypes";
import { useRoomTypeLabel } from "@/src/hooks/useRoomTypeLabel";
import { cn } from "@/src/utlis/cn";

/** Toggle chips for the predefined room types; the value keeps list order. */
export default function RoomTypePicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: readonly RoomType[];
  onChange: (value: RoomType[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const label = useRoomTypeLabel();

  const toggle = (type: RoomType) =>
    onChange(
      value.includes(type)
        ? value.filter((item) => item !== type)
        : sortRoomTypes([...value, type])
    );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {ROOM_TYPES.map((type) => {
        const selected = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(type)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-brand-green bg-brand-green text-brand-cream hover:bg-brand-green-dark"
                : "border-gray-200 bg-white text-gray-600 hover:border-brand-green hover:text-brand-green"
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            {label(type)}
          </button>
        );
      })}
    </div>
  );
}
