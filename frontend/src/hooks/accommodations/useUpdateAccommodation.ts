import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accommodationsService } from "@/src/services/accommodations.service";
import { UpdateAccommodationInput } from "@/src/types/accommodations.type";
import { QUERY_KEYS } from "@/src/constants/accommodations.constants";

export const useUpdateAccommodation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAccommodationInput;
    }) => accommodationsService.put(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ACCOMMODATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ADMIN_ACCOMMODATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ACCOMMODATION_DETAIL],
      });
    },
  });
};
