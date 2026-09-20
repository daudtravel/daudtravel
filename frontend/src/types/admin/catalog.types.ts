import type { OwnerRef } from "./partners.types";
import type { CurrencyCode } from "./currency.types";
import type { VehicleType } from "./drivers.types";

export const CATALOG_CATEGORIES = [
  "TOUR",
  "TRANSFER",
  "HOTEL",
  "VEHICLE",
  "INSURANCE",
  "SIM_CARD",
  "PACKAGE",
  "OTHER",
] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const CATALOG_UNITS = [
  "PER_PERSON",
  "PER_GROUP",
  "PER_NIGHT",
  "PER_DAY",
  "PER_TRIP",
  "PER_ITEM",
] as const;
export type CatalogUnit = (typeof CATALOG_UNITS)[number];

export const CATALOG_SEASONS = ["ALL_YEAR", "HIGH", "LOW"] as const;
export type CatalogSeason = (typeof CATALOG_SEASONS)[number];

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  description: string | null;
  unit: CatalogUnit;
  price: number;
  cost: number | null;
  /** price − cost, when a cost is on file. */
  margin: number | null;
  currency: CurrencyCode;
  /** The price in the currency the list is shown in. */
  converted: number | null;
  convertedCurrency: CurrencyCode | null;
  vehicleType: VehicleType | null;
  city: string | null;
  season: CatalogSeason;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  sortOrder: number;
  createdById: string | null;
  createdBy: OwnerRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogOption {
  id: string;
  name: string;
  category: CatalogCategory;
  unit: CatalogUnit;
  price: number;
  cost: number | null;
  currency: CurrencyCode;
}

export interface CatalogPayload {
  name?: string;
  category?: CatalogCategory;
  description?: string | null;
  unit?: CatalogUnit;
  price?: number;
  cost?: number | null;
  currency?: CurrencyCode;
  vehicleType?: VehicleType | null;
  city?: string | null;
  season?: CatalogSeason;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdById?: string | null;
}
