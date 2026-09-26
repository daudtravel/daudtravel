import type { OwnerRef } from "./partners.types";
import type { CurrencyCode } from "./currency.types";

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const EXPENSE_CATEGORIES = [
  "OFFICE",
  "SALARY",
  "FUEL",
  "VEHICLE_REPAIR",
  "VEHICLE_SERVICE",
  "RENT",
  "UTILITIES",
  "MARKETING",
  "TAX",
  "COMMUNICATION",
  "OTHER_EXPENSE",
] as const;

export const INCOME_CATEGORIES = [
  "HOTEL_COMMISSION",
  "SERVICE_INCOME",
  "OTHER_INCOME",
] as const;

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORIES_BY_TYPE: Record<
  TransactionType,
  readonly TransactionCategory[]
> = {
  EXPENSE: EXPENSE_CATEGORIES,
  INCOME: INCOME_CATEGORIES,
};

/** Categories where naming the vehicle matters (fuel, repairs, service). */
export const VEHICLE_CATEGORIES: TransactionCategory[] = [
  "FUEL",
  "VEHICLE_REPAIR",
  "VEHICLE_SERVICE",
];

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  amount: number;
  currency: CurrencyCode;
  fxRate: number;
  /** The amount converted with the stored rate. */
  amountGel: number;
  title: string;
  description: string | null;
  paymentMethod: string | null;
  vehicleId: string | null;
  driverId: string | null;
  hotelId: string | null;
  tourId: string | null;
  bookingId: string | null;
  employeeId: string | null;
  partnerId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
  } | null;
  driver: { id: string; firstName: string; lastName: string } | null;
  hotel: { id: string; name: string; city: string } | null;
  booking: { id: string; number: number; touristName: string } | null;
  employee: OwnerRef | null;
  partner: { id: string; name: string } | null;
  createdBy: OwnerRef | null;
}

export interface TransactionSummary {
  byCurrency: {
    type: TransactionType;
    currency: CurrencyCode;
    count: number;
    amount: number;
  }[];
  byCategory: {
    category: TransactionCategory;
    count: number;
    amount: number;
  }[];
  totalsGel: { income: number; expense: number; net: number };
}

export interface TransactionPayload {
  type?: TransactionType;
  category?: TransactionCategory;
  date?: string;
  amount?: number;
  currency?: CurrencyCode;
  title?: string;
  description?: string | null;
  paymentMethod?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  hotelId?: string | null;
  tourId?: string | null;
  bookingId?: string | null;
  employeeId?: string | null;
  partnerId?: string | null;
  createdById?: string | null;
}
