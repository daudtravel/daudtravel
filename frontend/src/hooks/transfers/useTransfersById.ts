import { useQuery } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";
import {
  QUERY_KEYS,
  TRANSFERS_CONFIG,
} from "@/src/constants/transfers.constants";

export const useTransferById = (id: string, locale?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSFERS, QUERY_KEYS.DETAIL, id, locale],
    queryFn: () => transfersService.getById(id, locale),
    staleTime: TRANSFERS_CONFIG.STALE_TIME,
    gcTime: TRANSFERS_CONFIG.CACHE_TIME,
    enabled: !!id,
  });
};
