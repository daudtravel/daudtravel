import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toursService } from "@/src/services/tours.service";
import { CreateTourInput } from "@/src/types/tours.type";
import { QUERY_KEYS } from "@/src/constants/tours.constants";

export const useCreateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTourInput) => toursService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TOURS] });
    },
  });
};
