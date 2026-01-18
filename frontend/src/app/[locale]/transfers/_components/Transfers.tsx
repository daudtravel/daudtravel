"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import TourLoader from "@/src/components/shared/loader/TourLoader";
import { Transfer } from "@/src/types/transfers.types";
import { useTransfers } from "@/src/hooks/transfers/useTransfers";

export const TransferBooking = () => {
  const t = useTranslations("transfers");
  const locale = useLocale();

  const { data, isLoading, isError } = useTransfers({
    locale,
    publicOnly: true,
  });

  const transfers = data?.data || [];

  const vehicleTranslationMap: Record<string, string> = {
    sedan: t("sedan"),
    minivan: t("minivan"),
    vito: t("vito"),
    sprinter: t("sprinter"),
    bus: t("bus"),
  };

  if (isLoading) return <TourLoader />;

  if (isError) {
    return (
      <div className="text-center p-4 text-red-500">
        {t("errorLoadingTransfers") || "Error loading transfer data"}
      </div>
    );
  }

  if (transfers.length === 0) {
    return <div className="text-center p-4">{t("noTransfers")}</div>;
  }

  return (
    <div className="w-full px-4 md:px-20 pb-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center sm:text-left">
        {t("bookYourTransfer")}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {transfers.map((transfer: Transfer) => {
          const localization =
            transfer.localizations.find((loc) => loc.locale === locale) ||
            transfer.localizations[0];

          const availableVehicles = transfer.vehicleTypes || [];
          const prices = availableVehicles.map((vt) => vt.price);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

          return (
            <div
              key={transfer.id}
              className="border rounded-lg p-4 flex flex-col gap-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">
                      {localization?.startLocation || "N/A"}
                    </span>
                    <span>→</span>
                    <span className="font-semibold">
                      {localization?.endLocation || "N/A"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/transfers/${transfer.id}`}
                  className="w-full sm:w-auto hidden md:block"
                >
                  <Button className="w-full sm:w-auto h-8">
                    {t("viewDetails")}
                  </Button>
                </Link>
              </div>

              {prices.length > 0 && (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{t("total")}:</span> ₾
                  {minPrice}
                  {minPrice !== maxPrice && ` - ₾${maxPrice}`}
                </div>
              )}

              {availableVehicles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">
                    {t("availableVehicles")}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableVehicles.map((vehicle) => (
                      <span
                        key={vehicle.id}
                        className="px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm flex items-center gap-2"
                      >
                        <span className="font-medium">
                          {vehicleTranslationMap[vehicle.type.toLowerCase()] ||
                            vehicle.type}
                        </span>
                        <span className="text-gray-500">
                          (↑{vehicle.maxPersons})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/${locale}/transfers/${transfer.id}`}
                className="w-full sm:w-auto md:hidden"
              >
                <Button className="w-full sm:w-auto h-8">
                  {t("viewDetails")}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {data.pagination.hasPreviousPage && (
            <Button variant="outline" size="sm">
              {t("previous") || "Previous"}
            </Button>
          )}
          <span className="flex items-center px-4 text-sm text-gray-600">
            {t("page")} {data.pagination.currentPage} {t("of")}{" "}
            {data.pagination.totalPages}
          </span>
          {data.pagination.hasNextPage && (
            <Button variant="outline" size="sm">
              {t("next") || "Next"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
