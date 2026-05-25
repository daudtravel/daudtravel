"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "xs" | "sm" | "md";
}

const SIZE_MAP = { xs: "h-3 w-3", sm: "h-4 w-4", md: "h-5 w-5" };

export function StarRating({ value, onChange, readonly = false, size = "sm" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const cls = SIZE_MAP[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= (hovered || value)
                ? "text-brand-yellow fill-brand-yellow"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
