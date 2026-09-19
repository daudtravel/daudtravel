import { AccessScope, PermissionModule } from '@prisma/client';
import {
  EffectivePermissions,
  ModuleAccess,
  PERMISSION_ACTIONS,
  PermissionAction,
  UNSCOPED_MODULES,
} from './access.types';

export interface RolePermissionInput {
  module: PermissionModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: AccessScope;
}

const ALL_MODULES = Object.values(PermissionModule);

const emptyAccess = (): ModuleAccess => ({
  view: null,
  create: null,
  edit: null,
  delete: null,
});

const widest = (
  a: AccessScope | null,
  b: AccessScope | null,
): AccessScope | null => {
  if (a === AccessScope.ALL || b === AccessScope.ALL) return AccessScope.ALL;
  if (a === AccessScope.OWN || b === AccessScope.OWN) return AccessScope.OWN;
  return null;
};

/**
 * Normalizes one role permission row: any write action implies view, and
 * unscoped modules always get ALL.
 */
export function normalizeRolePermission<T extends RolePermissionInput>(
  row: T,
): T {
  const canView = row.canView || row.canCreate || row.canEdit || row.canDelete;
  const scope = UNSCOPED_MODULES.includes(row.module)
    ? AccessScope.ALL
    : row.scope;
  return { ...row, canView, scope };
}

/**
 * Merges the permissions of every role a user holds. For each module and
 * action the widest scope granted by any role wins. Super admins get ALL.
 */
export function computeEffectivePermissions(
  isAdmin: boolean,
  rolePermissions: RolePermissionInput[],
): EffectivePermissions {
  const result = {} as EffectivePermissions;

  for (const module of ALL_MODULES) {
    result[module] = isAdmin
      ? { view: 'ALL', create: 'ALL', edit: 'ALL', delete: 'ALL' }
      : emptyAccess();
  }
  if (isAdmin) return result;

  for (const raw of rolePermissions) {
    const row = normalizeRolePermission(raw);
    const flags: Record<PermissionAction, boolean> = {
      view: row.canView,
      create: row.canCreate,
      edit: row.canEdit,
      delete: row.canDelete,
    };
    const current = result[row.module];
    for (const action of PERMISSION_ACTIONS) {
      if (flags[action]) {
        current[action] = widest(current[action], row.scope);
      }
    }
  }

  return result;
}

/** True when the user may perform `action` on `module` at all (own or all). */
export function hasPermission(
  permissions: EffectivePermissions,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  return permissions[module]?.[action] != null;
}
