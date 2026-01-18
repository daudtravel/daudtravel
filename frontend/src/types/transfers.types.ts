export enum VehicleType {
  SEDAN = "SEDAN",
  MINIVAN = "MINIVAN",
  VITO = "VITO",
  SPRINTER = "SPRINTER",
  BUS = "BUS",
}

export interface TransferLocalization {
  id?: string;
  locale: string;
  startLocation: string;
  endLocation: string;
}

export interface TransferVehicleType {
  id?: string;
  type: VehicleType;
  price: number;
  maxPersons: number;
}

export interface Transfer {
  id: string;
  isPublic: boolean;
  localizations: TransferLocalization[];
  vehicleTypes: TransferVehicleType[];
  createdAt: string;
  updatedAt: string;
}

export interface TransfersPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TransfersFilters {
  locale: string | null;
  publicOnly: boolean;
  search: string | null;
  vehicleType: VehicleType | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface TransfersResponse {
  success: boolean;
  message: string;
  data: Transfer[];
  pagination: TransfersPagination;
  filters: TransfersFilters;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: Transfer;
}

export interface TransferLocalizationInput {
  locale: string;
  startLocation: string;
  endLocation: string;
}

export interface VehicleTypeInput {
  type: VehicleType;
  price: number;
  maxPersons: number;
}

export interface CreateTransferInput {
  localizations?: TransferLocalizationInput[];
  vehicleTypes: VehicleTypeInput[];
  isPublic?: boolean;
}

export interface UpdateTransferInput {
  localizations?: TransferLocalizationInput[];
  vehicleTypes?: VehicleTypeInput[];
  isPublic?: boolean;
}

export interface TransfersQueryParams {
  page?: number;
  limit?: number;
  locale?: string;
  publicOnly?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  vehicleType?: VehicleType;
  minPrice?: number;
  maxPrice?: number;
}
