import { AccessScope, PermissionModule } from '@prisma/client';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
];

/** Per action: null = not allowed, OWN = only records the user owns, ALL = every record. */
export type ModuleAccess = Record<PermissionAction, AccessScope | null>;

export type EffectivePermissions = Record<PermissionModule, ModuleAccess>;

export interface AuthUser {
  /** Kept as `userId` for compatibility with the original JWT payload shape. */
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  roles: { id: string; name: string }[];
  permissions: EffectivePermissions;
}

export type PermissionCheck = {
  module: PermissionModule;
  action: PermissionAction;
};

export type AccessRule =
  | ({ kind: 'permission' } & PermissionCheck)
  | { kind: 'anyPermission'; checks: PermissionCheck[] }
  | { kind: 'superAdmin' }
  | { kind: 'authenticated' };

/** Modules where "own vs all records" makes no sense (the scope is ignored). */
export const UNSCOPED_MODULES: PermissionModule[] = [
  PermissionModule.WEBSITE,
  PermissionModule.ONLINE_ORDERS,
  PermissionModule.CURRENCY,
];
