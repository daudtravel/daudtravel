import type { RoomType } from "@/src/constants/roomTypes";

export enum AccommodationType {
  HOTEL = "HOTEL",
  APARTMENT = "APARTMENT",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface AccommodationLocalization {
  id: string;
  accommodationId: string;
  locale: string;
  name: string;
  description: string;
  address: string;
  /** Room types typed by hand, written in this language. */
  customRoomTypes?: string[];
}

export interface AccommodationImage {
  id: string;
  accommodationId: string;
  url: string;
  order: number;
  createdAt: Date;
}

export interface Accommodation {
  id: string;
  type: AccommodationType;
  price: number;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  /** Predefined room types (custom ones are per localization). */
  roomTypes?: RoomType[];
  mainImage: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  localizations: AccommodationLocalization[];
  images: AccommodationImage[];
}

export interface AccommodationsQueryParams {
  page?: number;
  limit?: number;
  type?: AccommodationType;
  locale?: string;
  city?: string;
  search?: string;
  /** A RoomType code (or a custom room type name). */
  roomType?: string;
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

export type GetAccommodationsResponse = PaginatedApiResponse<Accommodation[]>;
export type GetSingleAccommodationResponse = ApiResponse<Accommodation>;
export type CreateAccommodationResponse = ApiResponse<Accommodation>;
export type UpdateAccommodationResponse = ApiResponse<Accommodation>;

export interface CreateAccommodationLocalizationInput {
  locale: string;
  name: string;
  description: string;
  address?: string;
  customRoomTypes?: string[];
}

export interface CreateAccommodationInput {
  localizations: CreateAccommodationLocalizationInput[];
  type: AccommodationType;
  price: number;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities?: string[];
  roomTypes?: RoomType[];
  mainImage: string;
  gallery?: string[];
  isPublic?: boolean;
}

export interface UpdateAccommodationInput {
  localizations?: CreateAccommodationLocalizationInput[];
  type?: AccommodationType;
  price?: number;
  city?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  roomTypes?: RoomType[];
  mainImage?: string;
  gallery?: string[];
  isPublic?: boolean;
}

export type AccommodationWithLocale = Accommodation & {
  currentLocalization: AccommodationLocalization;
};
