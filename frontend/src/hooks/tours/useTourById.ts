import { useQuery } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { QUERY_KEYS, TOURS_CONFIG } from "@/src/constants/tours.constants";

interface UseTourByIdParams {
  id: string;
  locale?: string;
  allLocales?: boolean;
}

export const useTourById = ({
  id,
  locale,
  allLocales = false,
}: UseTourByIdParams) => {
  return useQuery({
    queryKey: allLocales
      ? [QUERY_KEYS.TOURS, id, "all-locales"]
      : [QUERY_KEYS.TOURS, id, locale],
    queryFn: () =>
      allLocales
        ? toursService.getByIdAllLocales(id)
        : toursService.getById(id, locale!),
    enabled: !!id && (allLocales || !!locale),
    staleTime: TOURS_CONFIG.STALE_TIME,
    gcTime: TOURS_CONFIG.CACHE_TIME,
  });
};
