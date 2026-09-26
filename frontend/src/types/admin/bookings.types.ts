import type { OwnerRef } from "./partners.types";
import type { CurrencyCode } from "./currency.types";
import type { VehicleType } from "./drivers.types";

export const BOOKING_TYPES = ["HOTEL", "TOUR", "TRANSFER", "PACKAGE"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_ITEM_TYPES = [
  "HOTEL",
  "TOUR",
  "TRANSFER",
  "VEHICLE",
  "INSURANCE",
  "SIM_CARD",
  "GUIDE",
  "OTHER",
] as const;
export type BookingItemType = (typeof BOOKING_ITEM_TYPES)[number];

/** Lines that make sense for each kind of booking (mirrors the API). */
export const ALLOWED_ITEM_TYPES: Record<BookingType, BookingItemType[]> = {
  HOTEL: ["HOTEL", "INSURANCE", "SIM_CARD", "OTHER"],
  TOUR: ["TOUR", "VEHICLE", "GUIDE", "INSURANCE", "SIM_CARD", "OTHER"],
  TRANSFER: ["TRANSFER", "VEHICLE", "OTHER"],
  PACKAGE: [...BOOKING_ITEM_TYPES],
};

export const COMMISSION_KINDS = [
  "CLIENT_REFERRAL",
  "DRIVER_REFERRAL",
  "OTHER",
] as const;
export type CommissionKind = (typeof COMMISSION_KINDS)[number];

export const PAYMENT_STATES = ["unpaid", "partial", "paid"] as const;

export interface BookingItem {
  id: string;
  type: BookingItemType;
  title: string;
  hotelId: string | null;
  roomNumber: string | null;
  roomType: string | null;
  checkIn: string | null;
  checkOut: string | null;
  tourId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  serviceDate: string | null;
  salePrice: number;
  costPrice: number;
  profit: number;
  supplierPaid: boolean;
  supplierPaidAt: string | null;
  notes: string | null;
  sortOrder: number;
  hotel: { id: string; name: string; city: string } | null;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    type: VehicleType;
  } | null;
  tour: { id: string } | null;
}

export interface BookingCommission {
  id: string;
  partnerId: string | null;
  recipientName: string;
  kind: CommissionKind;
  driverId: string | null;
  /** Percent; when set the amount is computed from it. */
  rate: number | null;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  note: string | null;
  partner: { id: string; name: string } | null;
  driver: { id: string; firstName: string; lastName: string } | null;
}

export interface Booking {
  id: string;
  number: number;
  type: BookingType;
  status: BookingStatus;
  touristName: string;
  touristPhone: string | null;
  touristEmail: string | null;
  touristCountry: string | null;
  adults: number;
  children: number;
  startDate: string;
  endDate: string | null;
  currency: CurrencyCode;
  fxRate: number;
  totalPrice: number;
  totalCost: number;
  totalCommission: number;
  paidAmount: number;
  balanceDue: number;
  profit: number;
  paymentMethod: string | null;
  referrerId: string | null;
  tourOrderId: string | null;
  transferOrderId: string | null;
  source: "manual" | "website";
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  referrer: { id: string; name: string } | null;
  createdBy: OwnerRef | null;
  items: BookingItem[];
  commissions: BookingCommission[];
}

export interface BookingSummaryRow {
  currency: CurrencyCode;
  count: number;
  totalPrice: number;
  totalCost: number;
  totalCommission: number;
  paidAmount: number;
  balanceDue: number;
  profit: number;
}

export interface BookingItemPayload {
  id?: string | null;
  type: BookingItemType;
  title: string;
  hotelId?: string | null;
  roomNumber?: string | null;
  roomType?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  tourId?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  serviceDate?: string | null;
  salePrice?: number | null;
  costPrice?: number | null;
  supplierPaid?: boolean;
  notes?: string | null;
  sortOrder?: number;
}

export interface BookingCommissionPayload {
  id?: string | null;
  partnerId?: string | null;
  recipientName?: string | null;
  kind: CommissionKind;
  driverId?: string | null;
  rate?: number | null;
  amount?: number | null;
  paid?: boolean;
  note?: string | null;
}

export interface BookingPayload {
  type?: BookingType;
  status?: BookingStatus;
  touristName?: string;
  touristPhone?: string | null;
  touristEmail?: string | null;
  touristCountry?: string | null;
  adults?: number;
  children?: number;
  startDate?: string;
  endDate?: string | null;
  currency?: CurrencyCode;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  referrerId?: string | null;
  tourOrderId?: string | null;
  transferOrderId?: string | null;
  notes?: string | null;
  items?: BookingItemPayload[];
  commissions?: BookingCommissionPayload[];
  createdById?: string | null;
}

/** What `GET /bookings/draft-from-order` returns. */
export interface BookingDraft {
  type: BookingType;
  tourOrderId?: string;
  transferOrderId?: string;
  touristName: string;
  touristPhone: string | null;
  touristEmail: string | null;
  adults: number;
  children: number;
  startDate: string;
  currency: CurrencyCode;
  paidAmount: number;
  items: BookingItemPayload[];
}

export interface LinkedOrders {
  tourOrders: Record<string, { id: string; number: number }>;
  transferOrders: Record<string, { id: string; number: number }>;
}
