// src/hooks/tours/useTours.ts
import { useQuery } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { ToursQueryParams } from "@/src/types/tours.type";
import { TOURS_CONFIG, QUERY_KEYS } from "@/src/constants/tours.constants";

export const useTours = (queryParams: ToursQueryParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TOURS, queryParams],
    queryFn: () => toursService.getAll(queryParams),
    staleTime: TOURS_CONFIG.STALE_TIME,
    gcTime: TOURS_CONFIG.CACHE_TIME,
  });
};
