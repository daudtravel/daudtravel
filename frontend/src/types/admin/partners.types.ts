export const PARTNER_TYPES = [
  "AGENT",
  "TOUR_AGENCY",
  "HOTEL_STAFF",
  "DRIVER",
  "INDIVIDUAL",
  "OTHER",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export interface OwnerRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  phone: string | null;
  email: string | null;
  /** Percent. */
  commissionRate: number;
  notes: string | null;
  isActive: boolean;
  createdById: string | null;
  createdBy: OwnerRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerOption {
  id: string;
  name: string;
  type: PartnerType;
  commissionRate: number;
}

export interface PartnerPayload {
  name: string;
  type: PartnerType;
  phone?: string | null;
  email?: string | null;
  commissionRate?: number;
  notes?: string | null;
  isActive?: boolean;
  createdById?: string | null;
}
