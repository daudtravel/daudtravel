"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { adminInputClass } from "./FormFields";
import { cn } from "@/src/utlis/cn";

/**
 * Free-text chips (driver languages, later hotel amenities…). Enter or comma
 * adds, Backspace on an empty input removes the last chip.
 */
export default function TagsInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  suggestions = [],
  maxLength = 50,
  disabled,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("admin.form");
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim().slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    onChange(next);
    setDraft("");
  };

  const remove = (tag: string) =>
    onChange(value.filter((item) => item !== tag));

  const unusedSuggestions = suggestions.filter(
    (suggestion) =>
      !value.some((item) => item.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-green-50 py-1 pe-1 ps-2.5 text-sm font-medium text-brand-green"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                disabled={disabled}
                aria-label={t("removeItem", { item: tag })}
                className="rounded-md p-0.5 text-brand-green/60 transition-colors hover:bg-brand-green/10 hover:text-brand-green disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={adminInputClass}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => add(draft)}
          disabled={disabled || !draft.trim()}
          aria-label={t("addItem")}
        >
          <Plus />
        </Button>
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {unusedSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              disabled={disabled}
              className="rounded-lg border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:border-brand-green hover:text-brand-green disabled:opacity-40"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
