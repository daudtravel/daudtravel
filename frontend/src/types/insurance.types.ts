// types/insurance.types.ts
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

export interface InsurancePerson {
  id: string;
  fullName: string;
  phoneNumber: string;
  passportPhoto: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  pricePerDay: number;
  baseAmount: number;
  discount: number;
  finalAmount: number;
  createdAt: string;
}

export interface InsuranceSubmission {
  id: string;
  externalOrderId: string;
  bogOrderId: string;
  submitterEmail: string;
  peopleCount: number;
  totalAmount: number;
  totalDays: number;
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: string;
  paymentUrl?: string;
  callbackData?: any;
  emailSent: boolean;
  emailSentAt?: string;
  expiresAt: string;
  paidAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
  people: InsurancePerson[];
}

export interface InsuranceSettings {
  id: string;
  pricePerDay: number;
  discount30Days: number;
  discount90Days: number;
  adminEmail: string;
  isActive: boolean;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationData;
}
