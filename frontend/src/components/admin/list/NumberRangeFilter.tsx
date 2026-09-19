"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterField } from "./FilterBar";

const clean = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return "";
  const num = Number(normalized);
  return Number.isFinite(num) && num >= 0 ? String(num) : "";
};

/** Min/max numeric filter, committed on blur / Enter (not on every key). */
export default function NumberRangeFilter({
  label,
  min,
  max,
  onChange,
}: {
  label: React.ReactNode;
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}) {
  const t = useTranslations("admin.list");
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);
  const committed = useRef({ min, max });

  useEffect(() => {
    committed.current = { min, max };
    setDraftMin(min);
    setDraftMax(max);
  }, [min, max]);

  const commit = () => {
    let nextMin = clean(draftMin);
    let nextMax = clean(draftMax);
    if (nextMin && nextMax && Number(nextMin) > Number(nextMax)) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }
    setDraftMin(nextMin);
    setDraftMax(nextMax);
    if (
      nextMin !== committed.current.min ||
      nextMax !== committed.current.max
    ) {
      committed.current = { min: nextMin, max: nextMax };
      onChange(nextMin, nextMax);
    }
  };

  const inputClass =
    "h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50/60 px-3 text-sm tabular-nums text-gray-800 placeholder:text-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/15";

  return (
    <FilterField label={label}>
      <div className="flex items-center gap-1.5">
        <input
          inputMode="decimal"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder={t("min")}
          className={inputClass}
          aria-label={t("min")}
        />
        <span className="text-gray-400">–</span>
        <input
          inputMode="decimal"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder={t("max")}
          className={inputClass}
          aria-label={t("max")}
        />
      </div>
    </FilterField>
  );
}
