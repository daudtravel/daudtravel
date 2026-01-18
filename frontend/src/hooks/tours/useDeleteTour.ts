import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { QUERY_KEYS } from "@/src/constants/tours.constants";

export const useDeleteTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tourId: string) => toursService.delete(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOURS] });
    },
  });
};
