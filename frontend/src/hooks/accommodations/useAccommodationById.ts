import { useQuery } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import {
  ACCOMMODATIONS_CONFIG,
  QUERY_KEYS,
} from "@/src/constants/accommodations.constants";

interface UseAccommodationByIdParams {
  id: string;
  locale?: string;
  allLocales?: boolean;
}

export const useAccommodationById = ({
  id,
  locale,
  allLocales = false,
}: UseAccommodationByIdParams) => {
  return useQuery({
    queryKey: allLocales
      ? [QUERY_KEYS.ACCOMMODATION_DETAIL, id, "all-locales"]
      : [QUERY_KEYS.ACCOMMODATION_DETAIL, id, locale],
    queryFn: () =>
      allLocales
        ? accommodationsService.getByIdAllLocales(id)
        : accommodationsService.getById(id, locale!),
    enabled: !!id && (allLocales || !!locale),
    staleTime: ACCOMMODATIONS_CONFIG.STALE_TIME,
    gcTime: ACCOMMODATIONS_CONFIG.CACHE_TIME,
  });
};
