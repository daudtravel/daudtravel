import type { OwnerRef } from "./partners.types";

export const HOTEL_CATEGORIES = [
  "ECONOMY",
  "STANDARD",
  "COMFORT",
  "LUXURY",
] as const;
export type HotelCategory = (typeof HOTEL_CATEGORIES)[number];

export const HOTEL_CONTACT_TYPES = [
  "RECEPTION",
  "RESERVATION",
  "SALES",
  "MANAGER",
  "ACCOUNTING",
  "OTHER",
] as const;
export type HotelContactType = (typeof HOTEL_CONTACT_TYPES)[number];

export interface HotelContact {
  id: string;
  type: HotelContactType;
  name: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  sortOrder: number;
}

export interface HotelContactPayload {
  type: HotelContactType;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  sortOrder?: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  region: string | null;
  address: string | null;
  stars: number | null;
  category: HotelCategory;
  /** Indicative price per night. */
  priceFrom: number | null;
  priceCurrency: string | null;
  website: string | null;
  /** Our commission, in percent. */
  commissionRate: number | null;
  notes: string | null;
  isActive: boolean;
  contacts: HotelContact[];
  createdById: string | null;
  createdBy: OwnerRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelOption {
  id: string;
  name: string;
  city: string;
  commissionRate: number | null;
  priceFrom: number | null;
  priceCurrency: string | null;
}

export interface HotelPayload {
  name?: string;
  city?: string;
  region?: string | null;
  address?: string | null;
  stars?: number | null;
  category?: HotelCategory;
  priceFrom?: number | null;
  priceCurrency?: string | null;
  website?: string | null;
  commissionRate?: number | null;
  notes?: string | null;
  isActive?: boolean;
  contacts?: HotelContactPayload[];
  createdById?: string | null;
}
