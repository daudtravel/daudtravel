export const PERMISSION_MODULES = [
  "BOOKINGS_HOTEL",
  "BOOKINGS_TOUR",
  "BOOKINGS_PACKAGE",
  "DRIVERS",
  "HOTELS",
  "PARTNERS",
  "TRANSACTIONS",
  "FINANCE",
  "CATALOG",
  "CALENDAR",
  "CURRENCY",
  "WEBSITE",
  "ONLINE_ORDERS",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type AccessScope = "OWN" | "ALL";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
];

export type ModuleAccess = Record<PermissionAction, AccessScope | null>;

export type EffectivePermissions = Record<PermissionModule, ModuleAccess>;

/** Modules where "own vs all records" has no meaning (scope is forced to ALL). */
export const UNSCOPED_MODULES: PermissionModule[] = [
  "WEBSITE",
  "ONLINE_ORDERS",
  "CURRENCY",
];

/** Groups used by the role editor (same order as the sidebar). */
export const PERMISSION_MODULE_GROUPS: {
  key: string;
  modules: PermissionModule[];
}[] = [
  {
    key: "operations",
    modules: [
      "BOOKINGS_HOTEL",
      "BOOKINGS_TOUR",
      "BOOKINGS_PACKAGE",
      "DRIVERS",
      "HOTELS",
      "PARTNERS",
      "CALENDAR",
    ],
  },
  {
    key: "finance",
    modules: ["TRANSACTIONS", "FINANCE", "CATALOG", "CURRENCY"],
  },
  { key: "website", modules: ["WEBSITE", "ONLINE_ORDERS"] },
];

export interface RoleRef {
  id: string;
  name: string;
}

export interface AuthProfile {
  id: string;
  /** Same as `id`; kept for compatibility with the original JWT payload. */
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleRef[];
  permissions: EffectivePermissions;
}

export interface RolePermission {
  module: PermissionModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: AccessScope;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
  userCount: number;
}

export interface RoleDetail extends Role {
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  }[];
}

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleRef[];
}

export interface UserLookup {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}
