import {
  TourType,
  IndividualPricing,
  GroupPricing,
  TourImage,
} from "@/src/types/tours.type";

export interface TourLocalization {
  locale: string;
  name: string;
  description: string;
  startLocation: string;
  endLocation?: string;
  locations: string[];
}

export interface TourData {
  id: string;
  type: TourType;
  days: number;
  nights: number;
  maxPersons?: number;
  isDaily: boolean;
  startDate?: Date;
  mainImage?: string;
  images?: TourImage[];
  individualPricing?: IndividualPricing;
  groupPricing?: GroupPricing;
  localizations?: TourLocalization[];
}

export interface PriceData {
  basePrice: number;
  discountedPrice: number;
  reservationPrice: number;
  remainingPrice: number;
  savings: number;
}

export interface BookingData {
  tourData: TourData;
  paymentType: "total" | "reservation";
  personCount: number;
  selectedDate: Date;
  prices: PriceData;
}

export interface PaymentProps {
  data: TourData;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingData | null;
}
