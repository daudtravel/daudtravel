import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersService } from "@/src/services/transfers.service";
import { QUERY_KEYS } from "@/src/constants/transfers.constants";

export const useDeleteTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSFERS] });
    },
  });
};
