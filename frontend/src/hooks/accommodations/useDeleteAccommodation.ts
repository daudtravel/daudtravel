import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import { QUERY_KEYS } from "@/src/constants/accommodations.constants";

export const useDeleteAccommodation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accommodationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ACCOMMODATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ADMIN_ACCOMMODATIONS],
      });
    },
  });
};
