import { useMemo } from "react";
import { useAdminTransfers } from "./useAdminTransfers";
import { VehicleType } from "@/src/types/transfers.types";

export const useTransferFilterOptions = () => {
  const { data } = useAdminTransfers({ limit: 1000 });

  const vehicleTypeOptions = useMemo(() => {
    return Object.values(VehicleType).map((type) => ({
      value: type,
      label: type.charAt(0) + type.slice(1).toLowerCase(),
    }));
  }, []);

  const priceRanges = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { min: 0, max: 1000 };
    }

    const allPrices = data.data.flatMap((transfer) =>
      transfer.vehicleTypes.map((vt) => vt.price)
    );

    return {
      min: Math.floor(Math.min(...allPrices) / 10) * 10,
      max: Math.ceil(Math.max(...allPrices) / 10) * 10,
    };
  }, [data]);

  const locationOptions = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { starts: [], ends: [] };
    }

    const starts = new Set<string>();
    const ends = new Set<string>();

    data.data.forEach((transfer) => {
      transfer.localizations.forEach((loc) => {
        if (loc.startLocation) starts.add(loc.startLocation);
        if (loc.endLocation) ends.add(loc.endLocation);
      });
    });

    return {
      starts: Array.from(starts).sort(),
      ends: Array.from(ends).sort(),
    };
  }, [data]);

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Updated" },
    { value: "isPublic", label: "Public Status" },
  ];

  const sortOrderOptions = [
    { value: "asc", label: "Ascending" },
    { value: "desc", label: "Descending" },
  ];

  return {
    vehicleTypeOptions,
    priceRanges,
    locationOptions,
    sortOptions,
    sortOrderOptions,
  };
};
