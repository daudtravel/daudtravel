import { useQuery } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import { AccommodationsQueryParams } from "@/src/types/accommodations.type";
import {
  ACCOMMODATIONS_CONFIG,
  QUERY_KEYS,
} from "@/src/constants/accommodations.constants";

export const useAdminAccommodations = (
  params: AccommodationsQueryParams = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_ACCOMMODATIONS, params],
    queryFn: () => accommodationsService.getAdmin(params),
    staleTime: ACCOMMODATIONS_CONFIG.STALE_TIME,
    gcTime: ACCOMMODATIONS_CONFIG.CACHE_TIME,
  });
};
