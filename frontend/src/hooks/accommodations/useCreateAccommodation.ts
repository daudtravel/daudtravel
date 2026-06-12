import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import { CreateAccommodationInput } from "@/src/types/accommodations.type";
import { QUERY_KEYS } from "@/src/constants/accommodations.constants";

export const useCreateAccommodation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccommodationInput) =>
      accommodationsService.create(data),
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
