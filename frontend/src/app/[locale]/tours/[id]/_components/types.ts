import type {
  IndividualPricing,
  GroupPricing,
  TourType,
} from "@/src/types/tours.type";

export interface MainImageData {
  src: string;
  alt: string;
}

export interface DescriptionData {
  name?: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
  locations: string[];
  allDestinations: string[];
  days: number;
  nights: number;
  maxPersons?: number;
  type: TourType;
  isDaily: boolean;
  startDate?: Date;
  individualPricing?: IndividualPricing;
  groupPricing?: GroupPricing;
}

export interface GalleryData {
  images: string[];
  mainImageSrc: string;
}

export interface PaymentData {
  type: TourType;
  individualPricing?: IndividualPricing;
  groupPricing?: GroupPricing;
  name?: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
  locations: string[];
  allDestinations: string[];
  days: number;
  nights: number;
  maxPersons?: number;
  isDaily: boolean;
  startDate?: Date;
  mainImage: string;
  images: Array<{ url: string; [key: string]: any }>;
  tourName?: string;
}

export interface ProcessedTourData {
  mainImage: MainImageData;
  description: DescriptionData;
  gallery: GalleryData;
  payment: PaymentData;
}

export interface NormalizedPricing {
  individualPricing?: IndividualPricing;
  groupPricing?: GroupPricing;
}
