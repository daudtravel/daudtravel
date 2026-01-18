import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";
import { QUERY_KEYS } from "@/src/constants/transfers.constants";
import { CreateTransferInput } from "@/src/types/transfers.types";

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferInput) => transfersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSFERS] });
    },
  });
};
