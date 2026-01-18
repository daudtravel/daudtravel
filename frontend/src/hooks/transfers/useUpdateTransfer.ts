import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";
import { QUERY_KEYS } from "@/src/constants/transfers.constants";
import { UpdateTransferInput } from "@/src/types/transfers.types";

export const useUpdateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransferInput }) =>
      transfersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TRANSFERS, QUERY_KEYS.DETAIL, variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TRANSFERS],
      });
    },
  });
};
