"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/src/utlis/cn";
import { Button } from "@/src/components/ui/button";

interface FilterBarProps {
  /** Usually a <SearchInput/>; always visible. */
  search?: React.ReactNode;
  /** Filter controls; collapsible on small screens. */
  children?: React.ReactNode;
  activeCount: number;
  onReset: () => void;
  /** Extra controls on the right of the search row (e.g. tabs). */
  aside?: React.ReactNode;
  className?: string;
}

export default function FilterBar({
  search,
  children,
  activeCount,
  onReset,
  aside,
  className,
}: FilterBarProps) {
  const t = useTranslations("admin.list");
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 print:hidden",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {search && <div className="min-w-[200px] flex-1">{search}</div>}
        {aside}
        {children && (
          <Button
            type="button"
            variant="outline"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <SlidersHorizontal />
            {t("filters")}
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1.5 text-[11px] font-bold text-brand-cream">
                {activeCount}
              </span>
            )}
          </Button>
        )}
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="text-gray-500 hover:text-red-600"
          >
            <X />
            {t("clearFilters")}
          </Button>
        )}
      </div>
      {children && (
        <div
          className={cn(
            "mt-3 grid gap-3 sm:grid-cols-2 lg:mt-3 lg:grid lg:grid-cols-3 xl:grid-cols-4",
            open ? "grid" : "hidden"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Label + control wrapper used inside FilterBar. */
export function FilterField({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
      {children}
    </div>
  );
}
