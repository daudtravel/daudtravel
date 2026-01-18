import { useQuery } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { TOURS_CONFIG, QUERY_KEYS } from "@/src/constants/tours.constants";

export const useTourFilterOptions = (locale: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TOURS, QUERY_KEYS.FILTER_OPTIONS, locale],
    queryFn: () => toursService.getFilterOptions(locale),
    staleTime: TOURS_CONFIG.STALE_TIME,
    gcTime: TOURS_CONFIG.CACHE_TIME,
  });
};
