"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { driversAPI, Driver } from "@/src/services/drivers.service";
import { DriverCard } from "../cards/DriverCard";

export function DriversSection() {
  const t = useTranslations("transfers");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversAPI.get(),
    staleTime: 1000 * 60 * 5,
  });

  const drivers: Driver[] = data?.data ?? [];

  if (isLoading) {
    return (
      <section className="bg-brand-green-50 px-4 md:px-20 py-16">
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-green-mid" />
        </div>
      </section>
    );
  }

  if (isError || drivers.length === 0) return null;

  return (
    <section className="bg-brand-green-50 px-4 md:px-20 py-16">
      {/* Section header */}
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-green-mid mb-1">
          {t("professionalTeam") || "Professional Team"}
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          {t("ourDrivers")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {drivers.map((driver: Driver) => (
          <DriverCard key={driver.id} driver={driver} />
        ))}
      </div>
    </section>
  );
}
