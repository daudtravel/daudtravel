import { useQuery } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import { AccommodationsQueryParams } from "@/src/types/accommodations.type";
import {
  ACCOMMODATIONS_CONFIG,
  QUERY_KEYS,
} from "@/src/constants/accommodations.constants";

export const useAccommodations = (queryParams: AccommodationsQueryParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOMMODATIONS, queryParams],
    queryFn: () => accommodationsService.getAll(queryParams),
    staleTime: ACCOMMODATIONS_CONFIG.STALE_TIME,
    gcTime: ACCOMMODATIONS_CONFIG.CACHE_TIME,
  });
};
