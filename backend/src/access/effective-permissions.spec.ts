import { AccessScope, PermissionModule } from '@prisma/client';
import {
  computeEffectivePermissions,
  hasPermission,
  normalizeRolePermission,
  RolePermissionInput,
} from './effective-permissions';

const row = (
  module: PermissionModule,
  flags: Partial<RolePermissionInput>,
  scope: AccessScope = AccessScope.OWN,
): RolePermissionInput => ({
  module,
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  scope,
  ...flags,
});

describe('computeEffectivePermissions', () => {
  it('gives super admins ALL on every module and action', () => {
    const perms = computeEffectivePermissions(true, []);
    for (const module of Object.values(PermissionModule)) {
      expect(perms[module]).toEqual({
        view: 'ALL',
        create: 'ALL',
        edit: 'ALL',
        delete: 'ALL',
      });
    }
  });

  it('gives nothing to a user without roles', () => {
    const perms = computeEffectivePermissions(false, []);
    expect(hasPermission(perms, PermissionModule.DRIVERS, 'view')).toBe(false);
    expect(perms.BOOKINGS_HOTEL.view).toBeNull();
  });

  it('implies view when any write action is granted', () => {
    const perms = computeEffectivePermissions(false, [
      row(PermissionModule.DRIVERS, { canEdit: true }),
    ]);
    expect(perms.DRIVERS.view).toBe('OWN');
    expect(perms.DRIVERS.edit).toBe('OWN');
    expect(perms.DRIVERS.create).toBeNull();
    expect(perms.DRIVERS.delete).toBeNull();
  });

  it('unions actions and keeps the widest scope across roles', () => {
    const perms = computeEffectivePermissions(false, [
      // role A: hotel bookings, own records, full CRUD
      row(PermissionModule.BOOKINGS_HOTEL, {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      }),
      // role B: hotel bookings, every record but view only
      row(PermissionModule.BOOKINGS_HOTEL, { canView: true }, AccessScope.ALL),
      // role C: tour bookings
      row(PermissionModule.BOOKINGS_TOUR, { canView: true }),
    ]);
    expect(perms.BOOKINGS_HOTEL).toEqual({
      view: 'ALL',
      create: 'OWN',
      edit: 'OWN',
      delete: 'OWN',
    });
    expect(perms.BOOKINGS_TOUR.view).toBe('OWN');
    expect(perms.BOOKINGS_PACKAGE.view).toBeNull();
  });

  it('forces ALL scope on unscoped modules', () => {
    const perms = computeEffectivePermissions(false, [
      row(PermissionModule.WEBSITE, { canView: true, canEdit: true }),
    ]);
    expect(perms.WEBSITE.view).toBe('ALL');
    expect(perms.WEBSITE.edit).toBe('ALL');
  });
});

describe('normalizeRolePermission', () => {
  it('keeps a row with no actions without view', () => {
    const normalized = normalizeRolePermission(
      row(PermissionModule.FINANCE, {}, AccessScope.ALL),
    );
    expect(normalized.canView).toBe(false);
  });

  it('sets view when delete is granted', () => {
    const normalized = normalizeRolePermission(
      row(PermissionModule.FINANCE, { canDelete: true }),
    );
    expect(normalized.canView).toBe(true);
  });
});
