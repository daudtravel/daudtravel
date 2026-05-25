"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { User, Star, Check } from "lucide-react";
import { Driver } from "@/src/services/drivers.service";

interface DriverSelectorProps {
  drivers: Driver[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function DriverSelector({ drivers, selectedId, onSelect }: DriverSelectorProps) {
  const t = useTranslations("transfers");

  return (
    <div className="grid grid-cols-1 gap-2">
      {/* Any driver option */}
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
          selectedId === ""
            ? "border-brand-green bg-brand-green-50"
            : "border-gray-100 bg-white hover:border-brand-green-100"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 flex-1">{t("anyDriver")}</span>
        {selectedId === "" && (
          <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </button>

      {/* Individual drivers */}
      <div className="max-h-52 overflow-y-auto space-y-2 pr-0.5">
        {drivers.map((driver) => {
          const isSelected = selectedId === driver.id;
          return (
            <button
              key={driver.id}
              type="button"
              onClick={() => onSelect(driver.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                isSelected
                  ? "border-brand-green bg-brand-green-50"
                  : "border-gray-100 bg-white hover:border-brand-green-100"
              }`}
            >
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src={
                    driver.photo
                      ? `${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`
                      : "/images/driver-placeholder.jpg"
                  }
                  alt={`${driver.firstName} ${driver.lastName}`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? "text-brand-green" : "text-gray-800"}`}>
                  {driver.firstName} {driver.lastName}
                </p>
                {driver.averageRating !== null && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-brand-yellow fill-brand-yellow" />
                    <span className="text-xs text-gray-500">
                      {driver.averageRating} ({driver.totalReviews})
                    </span>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
