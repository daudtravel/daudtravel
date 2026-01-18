import { useQuery } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { ToursQueryParams } from "@/src/types/tours.type";
import { QUERY_KEYS, TOURS_CONFIG } from "@/src/constants/tours.constants";

export const useAdminTours = (params: ToursQueryParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TOURS, QUERY_KEYS.ADMIN, params],
    queryFn: () => toursService.getAdmin(params),
    staleTime: TOURS_CONFIG.STALE_TIME,
    gcTime: TOURS_CONFIG.CACHE_TIME,
  });
};