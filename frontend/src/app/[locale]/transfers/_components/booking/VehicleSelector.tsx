"use client";

import { useTranslations } from "next-intl";
import { Users, Check } from "lucide-react";
import { VehicleType } from "@/src/types/transfers.types";

type VehicleKey = "sedan" | "minivan" | "vito" | "sprinter" | "bus";

interface VehicleOption {
  id: string;
  type: VehicleType;
  price: number;
  maxPersons: number;
}

interface VehicleSelectorProps {
  vehicles: VehicleOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const VEHICLE_EMOJI: Record<string, string> = {
  sedan: "🚗",
  minivan: "🚐",
  vito: "🚌",
  sprinter: "🚌",
  bus: "🚍",
};

export function VehicleSelector({ vehicles, selectedId, onSelect }: VehicleSelectorProps) {
  const t = useTranslations("transfers");

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {vehicles.map((v) => {
        const isSelected = v.id === selectedId;
        const key = v.type.toLowerCase() as VehicleKey;

        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id!)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
              isSelected
                ? "border-brand-green bg-brand-green-50 shadow-sm"
                : "border-gray-100 bg-white hover:border-brand-green-100 hover:bg-brand-green-50/40"
            }`}
          >
            <span className="text-2xl">{VEHICLE_EMOJI[v.type.toLowerCase()] || "🚗"}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${isSelected ? "text-brand-green" : "text-gray-800"}`}>
                  {t(key) || v.type}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {t("upTo") || "Up to"} {v.maxPersons} {t("passengers")}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-base font-bold ${isSelected ? "text-brand-green" : "text-gray-700"}`}>
                ₾{v.price}
              </span>
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
  );
}
