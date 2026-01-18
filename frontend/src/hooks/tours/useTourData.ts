import { useQuery } from "@tanstack/react-query";
import { toursAPI } from "@/src/services/tours.service";
import type { Tour } from "@/src/types/tours.type";

interface UseTourDataParams {
  id: string;
  locale: string;
}

export const useTourData = ({ id, locale }: UseTourDataParams) => {
  const query = useQuery({
    queryKey: ["tour", id, locale],
    queryFn: () => toursAPI.getById(id, locale),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tour = query.data?.data as Tour | undefined;

  return {
    tour,
    isLoading: query.isLoading,
    error: query.error,
  };
};
