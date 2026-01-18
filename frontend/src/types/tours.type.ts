export enum TourType {
  GROUP = "GROUP",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface TourLocalization {
  id: string;
  tourId: string;
  locale: string;
  name: string;
  description: string;
  startLocation: string;
  locations: string[];
}

export interface TourImage {
  id: string;
  tourId: string;
  url: string;
  order: number;
  createdAt: Date;
}

export interface GroupPricing {
  id: string;
  tourId: string;
  totalPrice: number;
  reservationPrice: number;
  discountedPrice?: number;
}

export interface IndividualPricing {
  id: string;
  tourId: string;
  seasonTotalPrice: number;
  seasonReservationPrice: number;
  seasonDiscountedPrice?: number;
  offSeasonTotalPrice: number;
  offSeasonReservationPrice: number;
  offSeasonDiscountedPrice?: number;
}

export interface Tour {
  id: string;
  type: TourType;
  days: number;
  nights: number;
  maxPersons?: number;
  startDate?: Date;
  isPublic: boolean;
  isDaily: boolean;
  mainImage: string;
  createdAt: Date;
  updatedAt: Date;
  localizations: TourLocalization[];
  images: TourImage[];
  groupPricing?: GroupPricing;
  individualPricing?: IndividualPricing;
}

export interface ToursQueryParams {
  page?: number;
  limit?: number;
  type?: TourType;
  locale?: string;
  startLocation?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export type GetToursResponse = PaginatedApiResponse<Tour[]>;
export type GetSingleTourResponse = ApiResponse<Tour>;
export type CreateTourResponse = ApiResponse<Tour>;
export type UpdateTourResponse = ApiResponse<Tour>;
export type DeleteTourResponse = ApiResponse<{ deleted: boolean }>;

export interface CreateTourLocalizationInput {
  locale: string;
  name: string;
  description: string;
  startLocation: string;
  locations?: string[];
}

export interface CreateGroupPricingInput {
  totalPrice: number;
  reservationPrice: number;
  discountedPrice?: number;
}

export interface CreateIndividualPricingInput {
  seasonTotalPrice: number;
  seasonReservationPrice: number;
  seasonDiscountedPrice?: number;
  offSeasonTotalPrice: number;
  offSeasonReservationPrice: number;
  offSeasonDiscountedPrice?: number;
}

export interface CreateTourInput {
  localizations: CreateTourLocalizationInput[];
  type: TourType;
  days: number;
  nights: number;
  mainImage: string;
  gallery?: string[];
  isPublic?: boolean;
  isDaily?: boolean;
  groupPricing?: CreateGroupPricingInput;
  individualPricing?: CreateIndividualPricingInput;
  startDate?: string;
  maxPersons?: number;
}

export interface UpdateTourLocalizationInput {
  locale: string;
  name?: string;
  description?: string;
  startLocation?: string;
  locations?: string[];
}

export interface UpdateGroupPricingInput {
  totalPrice?: number;
  reservationPrice?: number;
  discountedPrice?: number;
}

export interface UpdateIndividualPricingInput {
  seasonTotalPrice?: number;
  seasonReservationPrice?: number;
  seasonDiscountedPrice?: number;
  offSeasonTotalPrice?: number;
  offSeasonReservationPrice?: number;
  offSeasonDiscountedPrice?: number;
}

export interface UpdateTourInput {
  localizations?: UpdateTourLocalizationInput[];
  type?: TourType;
  days?: number;
  nights?: number;
  mainImage?: string | null;
  gallery?: string[];
  isPublic?: boolean;
  isDaily?: boolean;
  groupPricing?: UpdateGroupPricingInput;
  individualPricing?: UpdateIndividualPricingInput;
  startDate?: string;
  maxPersons?: number;
}

export interface TourFilters {
  startLocation?: string;
  type?: TourType;
}

export function isGroupTour(
  tour: Tour
): tour is Tour & { groupPricing: GroupPricing } {
  return tour.type === TourType.GROUP && !!tour.groupPricing;
}

export function isIndividualTour(
  tour: Tour
): tour is Tour & { individualPricing: IndividualPricing } {
  return tour.type === TourType.INDIVIDUAL && !!tour.individualPricing;
}

export type TourFormData = Omit<CreateTourInput, "localizations"> & {
  localizations: Record<string, Omit<CreateTourLocalizationInput, "locale">>;
};

export type TourWithLocale = Tour & {
  currentLocalization: TourLocalization;
};
