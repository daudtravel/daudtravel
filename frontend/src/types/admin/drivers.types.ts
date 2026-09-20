import type { OwnerRef } from "./partners.types";

export const VEHICLE_TYPES = [
  "SEDAN",
  "MINIVAN",
  "VITO",
  "SPRINTER",
  "BUS",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_OWNERSHIPS = ["DRIVER", "COMPANY"] as const;
export type VehicleOwnership = (typeof VEHICLE_OWNERSHIPS)[number];

export interface DriverRef {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface VehicleSummary {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
  seats: number;
  plateNumber: string | null;
  ownership: VehicleOwnership;
  isActive: boolean;
}

export interface Vehicle extends VehicleSummary {
  color: string | null;
  notes: string | null;
  driverId: string | null;
  driver: DriverRef | null;
  createdById: string | null;
  createdBy: OwnerRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleOption {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
  seats: number;
  plateNumber: string | null;
  driverId: string | null;
}

export interface VehiclePayload {
  type?: VehicleType;
  brand?: string;
  model?: string;
  year?: number | null;
  seats?: number;
  plateNumber?: string | null;
  color?: string | null;
  ownership?: VehicleOwnership;
  driverId?: string | null;
  isActive?: boolean;
  notes?: string | null;
  createdById?: string | null;
}

export interface DriverReview {
  id: string;
  driverId: string;
  rating: number;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
}

export interface AdminDriver {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  languages: string[];
  dailyRentPrice: number | null;
  carPhotos: string[];
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  showOnWebsite: boolean;
  referrerId: string | null;
  referrer: { id: string; name: string; type: string } | null;
  /** Percent paid to the referrer. */
  referrerCommissionRate: number | null;
  createdById: string | null;
  createdBy: OwnerRef | null;
  vehicles: VehicleSummary[];
  counts: { reviews: number; vehicles: number; transferOrders: number };
  averageRating: number | null;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDriverDetail extends AdminDriver {
  reviews: DriverReview[];
}

export interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photo: string | null;
  vehicles: { id: string; type: VehicleType; brand: string; model: string }[];
}

export interface DriverPayload {
  firstName?: string;
  lastName?: string;
  languages?: string[];
  dailyRentPrice?: number | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
  showOnWebsite?: boolean;
  referrerId?: string | null;
  referrerCommissionRate?: number | null;
  createdById?: string | null;
  /** Edit only: delete the stored profile photo. */
  removePhoto?: boolean;
}

export interface DriverMonth {
  month: number;
  transferJobs: number;
  transferRevenue: number;
}

export interface DriverMonthlyJob {
  id: string;
  transferDate: string;
  transferTime: string;
  paymentAmount: number;
  passengerCount: number;
  vehicleType: VehicleType;
  transferStartLocation: string;
  transferEndLocation: string;
  customerFirstName: string;
  customerLastName: string;
}

export interface DriverMonthly {
  driverId: string;
  year: number;
  availableYears: number[];
  months: DriverMonth[];
  totals: { transferJobs: number; transferRevenue: number };
  jobs: DriverMonthlyJob[];
}
