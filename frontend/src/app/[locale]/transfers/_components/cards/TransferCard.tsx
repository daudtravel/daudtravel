"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, ArrowRight, Users, ChevronRight, Car } from "lucide-react";
import { Transfer } from "@/src/types/transfers.types";

type VehicleKey = "sedan" | "minivan" | "vito" | "sprinter" | "bus";

interface TransferCardProps {
  transfer: Transfer;
}

export function TransferCard({ transfer }: TransferCardProps) {
  const t = useTranslations("transfers");
  const locale = useLocale();

  const localization =
    transfer.localizations.find((l) => l.locale === locale) ||
    transfer.localizations[0];

  const vehicles = transfer.vehicleTypes || [];
  const prices = vehicles.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const from = localization?.startLocation || "—";
  const to = localization?.endLocation || "—";

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-md hover:border-brand-green transition-colors duration-300 overflow-hidden flex flex-col">
      {/* Green top accent */}
      <div className="h-1 bg-brand-green" />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Route */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand-green shrink-0" />
            <span className="font-semibold text-gray-800 text-sm">{from}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand-green-mid shrink-0" />
            <span className="font-semibold text-gray-700 text-sm">{to}</span>
          </div>
        </div>

        {/* Price badge */}
        {prices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-brand-yellow/15 text-brand-green font-semibold px-3 py-1.5 rounded-full text-sm">
              ₾{minPrice}
              {minPrice !== maxPrice && ` – ₾${maxPrice}`}
            </span>
            <span className="text-xs text-gray-400">{t("perTrip")}</span>
          </div>
        )}

        {/* Vehicles */}
        {vehicles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vehicles.map((vehicle) => (
              <span
                key={vehicle.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-green-50 rounded-lg text-xs font-medium text-brand-green border border-brand-green-100"
              >
                <Car className="h-3 w-3 shrink-0" />
                <span className="capitalize">
                  {t(vehicle.type.toLowerCase() as VehicleKey) || vehicle.type}
                </span>
                <span className="text-brand-green-mid flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {vehicle.maxPersons}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link href={`/${locale}/transfers/${transfer.id}`}>
          <button className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors duration-200 group-hover:shadow-md">
            {t("bookNow")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
