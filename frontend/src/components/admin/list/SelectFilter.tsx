"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { FilterField } from "./FilterBar";

const ALL = "__all__";

export interface FilterOption {
  value: string;
  label: string;
}

/** Single-choice filter with an "All" entry; empty string = no filter. */
export default function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.list");
  // A value that isn't in the options (e.g. stale URL) falls back to "All".
  const known = options.some((o) => o.value === value);

  return (
    <FilterField label={label}>
      <Select
        value={known ? value : ALL}
        onValueChange={(v) => onChange(v === ALL ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/60 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>{allLabel ?? t("all")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
