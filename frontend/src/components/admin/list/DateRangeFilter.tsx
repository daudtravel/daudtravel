"use client";

import { useTranslations } from "next-intl";
import { CalendarRange } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toDateOnly } from "@/src/utlis/admin/format";
import { FilterField } from "./FilterBar";

type Preset = "today" | "last7" | "thisMonth" | "lastMonth" | "thisYear";

function presetRange(preset: Preset): [string, string] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today":
      return [toDateOnly(now), toDateOnly(now)];
    case "last7": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return [toDateOnly(from), toDateOnly(now)];
    }
    case "thisMonth":
      return [toDateOnly(new Date(y, m, 1)), toDateOnly(new Date(y, m + 1, 0))];
    case "lastMonth":
      return [toDateOnly(new Date(y, m - 1, 1)), toDateOnly(new Date(y, m, 0))];
    case "thisYear":
      return [toDateOnly(new Date(y, 0, 1)), toDateOnly(new Date(y, 11, 31))];
  }
}

const PRESETS: Preset[] = ["today", "last7", "thisMonth", "lastMonth", "thisYear"];

/**
 * From/to date inputs (YYYY-MM-DD) with quick presets. Picking a "from" after
 * the current "to" (or vice versa) moves the other bound so the range stays valid.
 */
export default function DateRangeFilter({
  label,
  from,
  to,
  onChange,
}: {
  label: React.ReactNode;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const t = useTranslations("admin.list");

  const setFrom = (value: string) => {
    onChange(value, to && value && value > to ? value : to);
  };
  const setTo = (value: string) => {
    onChange(from && value && value < from ? value : from, value);
  };

  const inputClass =
    "h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50/60 px-2.5 text-sm text-gray-800 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/15";

  return (
    <FilterField label={label}>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          className={inputClass}
          aria-label={t("dateFrom")}
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          className={inputClass}
          aria-label={t("dateTo")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/60 text-gray-500 transition-colors hover:bg-brand-green-50 hover:text-brand-green"
              aria-label={t("datePresets")}
              title={t("datePresets")}
            >
              <CalendarRange className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onSelect={() => {
                  const [f, tt] = presetRange(preset);
                  onChange(f, tt);
                }}
              >
                {t(`presets.${preset}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </FilterField>
  );
}
