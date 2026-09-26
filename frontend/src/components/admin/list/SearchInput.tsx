"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { cn } from "@/src/utlis/cn";

/** Debounced search box; follows external resets of `value`. */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  delay = 400,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const t = useTranslations("admin.list");
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(value);

  // External change (e.g. "clear filters") → reflect it in the box.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const emit = (next: string) => {
    const trimmed = next.trim();
    if (trimmed === lastSent.current) return;
    lastSent.current = trimmed;
    onChange(trimmed);
  };

  const handleChange = (next: string) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => emit(next), delay);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (timer.current) clearTimeout(timer.current);
            emit(draft);
          }
        }}
        placeholder={placeholder ?? t("search")}
        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/60 pe-9 ps-9 text-sm text-gray-800 placeholder:text-gray-400 transition-colors focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/15 [&::-webkit-search-cancel-button]:hidden"
        maxLength={200}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            setDraft("");
            emit("");
          }}
          className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={t("clearSearch")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
