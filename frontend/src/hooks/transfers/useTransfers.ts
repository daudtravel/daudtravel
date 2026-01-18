import { useQuery } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";

import {
  TRANSFERS_CONFIG,
  QUERY_KEYS,
} from "@/src/constants/transfers.constants";
import { TransfersQueryParams } from "@/src/types/transfers.types";

export const useTransfers = (queryParams: TransfersQueryParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSFERS, QUERY_KEYS.PUBLIC, queryParams],
    queryFn: () => transfersService.getPublic(queryParams),
    staleTime: TRANSFERS_CONFIG.STALE_TIME,
    gcTime: TRANSFERS_CONFIG.CACHE_TIME,
  });
};
