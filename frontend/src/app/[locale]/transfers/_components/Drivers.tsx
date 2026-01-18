"use client";

import ToursSectionLoader from "@/src/components/shared/loader/ToursSectionLoader";
import { Card, CardHeader, CardTitle } from "@/src/components/ui/card";
import { driversAPI } from "@/src/services/drivers.service";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
}

interface DriversResponse {
  message: string;
  count: number;
  data: Driver[];
}

export function Drivers() {
  const locale = useLocale();
  const t = useTranslations("transfers");

  const { data, isLoading, error } = useQuery<DriversResponse>({
    queryKey: ["drivers", locale],
    queryFn: () => driversAPI.get(locale),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <ToursSectionLoader />;
  }

  if (error instanceof Error) {
    return <p>Error fetching drivers: {error.message}</p>;
  }

  const drivers = data?.data ?? [];

  return (
    <div className="px-4 md:px-20">
      <h2 className="text-3xl font-bold mb-6 text-center">{t("ourDrivers")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {drivers.map((driver) => (
          <Card
            key={driver.id}
            className="overflow-hidden bg-[#f2f5ff] shadow-xl"
          >
            <CardHeader className="text-center pb-4">
              <Image
                src={
                  driver.photo
                    ? `${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`
                    : "/images/driver-placeholder.jpg"
                }
                alt={`${driver.firstName} ${driver.lastName}`}
                className="rounded-full w-56 h-56 mx-auto mb-4 object-cover"
                width={224}
                height={224}
              />
              <CardTitle className="text-2xl">
                {driver.firstName} {driver.lastName}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
