import { Transfer } from "@/src/types/transfers.types";
import { useMemo } from "react";

interface UseTransferDataOptions {
  transfer: Transfer | undefined;
  locale?: string;
  fallbackLocale?: string;
}

export const useTransferData = ({
  transfer,
  locale = "en",
  fallbackLocale = "ka",
}: UseTransferDataOptions) => {
  const localization = useMemo(() => {
    if (!transfer?.localizations) return null;

    const requested = transfer.localizations.find(
      (loc) => loc.locale === locale
    );
    if (requested) return requested;

    const fallback = transfer.localizations.find(
      (loc) => loc.locale === fallbackLocale
    );
    if (fallback) return fallback;

    return transfer.localizations[0] || null;
  }, [transfer, locale, fallbackLocale]);

  const priceRange = useMemo(() => {
    if (!transfer?.vehicleTypes || transfer.vehicleTypes.length === 0) {
      return { min: 0, max: 0 };
    }

    const prices = transfer.vehicleTypes.map((vt) => vt.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [transfer]);

  const availableVehicleTypes = useMemo(() => {
    return transfer?.vehicleTypes || [];
  }, [transfer]);

  const maxPassengers = useMemo(() => {
    if (!transfer?.vehicleTypes || transfer.vehicleTypes.length === 0) {
      return 0;
    }

    return Math.max(...transfer.vehicleTypes.map((vt) => vt.maxPersons));
  }, [transfer]);

  const cheapestVehicle = useMemo(() => {
    if (!transfer?.vehicleTypes || transfer.vehicleTypes.length === 0) {
      return null;
    }

    return transfer.vehicleTypes.reduce((cheapest, current) =>
      current.price < cheapest.price ? current : cheapest
    );
  }, [transfer]);

  return {
    transfer,
    localization,

    priceRange,
    availableVehicleTypes,
    maxPassengers,
    cheapestVehicle,

    startLocation: localization?.startLocation || "",
    endLocation: localization?.endLocation || "",

    isPublic: transfer?.isPublic || false,
  };
};
