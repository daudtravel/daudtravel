export interface TourOrderCustomer {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface TourOrder {
  id: string;
  customer: TourOrderCustomer;
  peopleAmount: number;
  selectedDate: string;
  tourDurationDays: number;
  tourDurationNights: number;
  tourName: string;
  tourDescription?: string | null;
  startLocation?: string | null;
  endLocation?: string | null;
  locations?: string[];
  isFullPayment: boolean;
  totalTourPrice: number;
  amountPaid: number;
  amountRemaining?: number;
  externalOrderId: string;
  bogOrderId: string;
  status: "pending" | "confirmed" | "cancelled" | "failed";
  paymentUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourOrdersPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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

export interface TourWithLocale extends Tour {
  currentLocalization: TourLocalization;
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
