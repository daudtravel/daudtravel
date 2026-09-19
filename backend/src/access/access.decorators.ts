import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import {
  AccessRule,
  AuthUser,
  PermissionAction,
  PermissionCheck,
} from './access.types';

export const ACCESS_RULE_KEY = 'access_rule';

/**
 * Routes guarded by AuthGuard WITHOUT one of these decorators are treated as
 * super-admin only (secure default).
 */
export const RequirePermission = (
  module: PermissionModule,
  action: PermissionAction,
) =>
  SetMetadata(ACCESS_RULE_KEY, {
    kind: 'permission',
    module,
    action,
  } satisfies AccessRule);

export const RequireAnyPermission = (...checks: PermissionCheck[]) =>
  SetMetadata(ACCESS_RULE_KEY, {
    kind: 'anyPermission',
    checks,
  } satisfies AccessRule);

export const SuperAdminOnly = () =>
  SetMetadata(ACCESS_RULE_KEY, { kind: 'superAdmin' } satisfies AccessRule);

/** Any signed-in, active back-office user. */
export const AuthenticatedOnly = () =>
  SetMetadata(ACCESS_RULE_KEY, {
    kind: 'authenticated',
  } satisfies AccessRule);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);

/**
 * Modules whose users need to pick shared records (drivers, hotels, partners…)
 * in forms and filters. Lookup endpoints return minimal fields only.
 */
export const LOOKUP_CONSUMERS: PermissionCheck[] = [
  PermissionModule.BOOKINGS_HOTEL,
  PermissionModule.BOOKINGS_TOUR,
  PermissionModule.BOOKINGS_PACKAGE,
  PermissionModule.DRIVERS,
  PermissionModule.HOTELS,
  PermissionModule.PARTNERS,
  PermissionModule.TRANSACTIONS,
  PermissionModule.FINANCE,
  PermissionModule.CATALOG,
  PermissionModule.CALENDAR,
].map((module) => ({ module, action: 'view' as const }));
