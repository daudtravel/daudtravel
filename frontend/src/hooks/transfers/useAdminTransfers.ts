import { useQuery } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";
import {
  QUERY_KEYS,
  TRANSFERS_CONFIG,
} from "@/src/constants/transfers.constants";
import { TransfersQueryParams } from "@/src/types/transfers.types";

export const useAdminTransfers = (params: TransfersQueryParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSFERS, QUERY_KEYS.ADMIN, params],
    queryFn: () => transfersService.getAll(params),
    staleTime: TRANSFERS_CONFIG.STALE_TIME,
    gcTime: TRANSFERS_CONFIG.CACHE_TIME,
  });
};
