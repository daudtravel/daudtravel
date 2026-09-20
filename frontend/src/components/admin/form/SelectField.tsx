"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/utlis/cn";
import { RequiredMark } from "./FormFields";

const NONE = "__none__";

export interface SelectFieldOption {
  value: string;
  label: string;
}

/**
 * Labelled select for form dialogs. Radix needs a non-empty item value, so the
 * optional "nothing selected" entry is mapped to an empty string on change.
 */
export default function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  emptyLabel,
  placeholder,
  required,
  disabled,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  /** When given, adds a first entry meaning "no value". */
  emptyLabel?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const known = options.some((option) => option.value === value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <RequiredMark />}
      </label>
      <Select
        value={known ? value : emptyLabel ? NONE : ""}
        onValueChange={(next) => onChange(next === NONE ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger className="h-11 rounded-xl border-gray-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {emptyLabel && <SelectItem value={NONE}>{emptyLabel}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
