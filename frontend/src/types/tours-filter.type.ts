import { Tour, TourType } from "./tours.type";

export interface FilterValues {
  start_location?: string;
  type?: TourType;
}

export interface TourFiltersProps {
  urlStartLocation?: string;
  type?: TourType;
  filtersData?: { data?: { tours?: Tour[] } };
  isLoading: boolean;
  onSearch: (filters: FilterValues) => void;
  onReset: () => void;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}
