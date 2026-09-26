import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  computeEffectivePermissions,
  hasPermission,
} from './effective-permissions';
import { AccessRule, AuthUser, PermissionAction } from './access.types';

export interface LoadedAuthUser extends AuthUser {
  sessionsRevokedAt: Date | null;
}

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Loads the user fresh from the DB (so role / status changes apply immediately). */
  async loadAuthUser(userId: unknown): Promise<LoadedAuthUser | null> {
    if (typeof userId !== 'string' || !userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        isActive: true,
        sessionsRevokedAt: true,
        roles: {
          select: { id: true, name: true, permissions: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!user || !user.isActive) return null;

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      sessionsRevokedAt: user.sessionsRevokedAt,
      roles: user.roles.map((r) => ({ id: r.id, name: r.name })),
      permissions: computeEffectivePermissions(
        user.isAdmin,
        user.roles.flatMap((r) => r.permissions),
      ),
    };
  }

  satisfies(user: AuthUser, rule: AccessRule): boolean {
    switch (rule.kind) {
      case 'authenticated':
        return true;
      case 'superAdmin':
        return user.isAdmin;
      case 'permission':
        return hasPermission(user.permissions, rule.module, rule.action);
      case 'anyPermission':
        return rule.checks.some((c) =>
          hasPermission(user.permissions, c.module, c.action),
        );
      default:
        return false;
    }
  }

  can(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
  ): boolean {
    return hasPermission(user.permissions, module, action);
  }

  /** True when the action is allowed on every record (not only own ones). */
  canAll(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
  ): boolean {
    return user.permissions[module]?.[action] === 'ALL';
  }

  /**
   * Prisma `where` fragment restricting a query to the records the user may
   * act on. Returns `null` when the user has no access at all.
   */
  scopeWhere(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
  ): { createdById?: string } | null {
    const scope = user.permissions[module]?.[action];
    if (!scope) return null;
    return scope === 'ALL' ? {} : { createdById: user.userId };
  }

  canAccessRecord(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
    ownerId: string | null | undefined,
  ): boolean {
    const scope = user.permissions[module]?.[action];
    if (!scope) return false;
    return scope === 'ALL' || (!!ownerId && ownerId === user.userId);
  }

  /** Throws 404 (not 403) so records outside the user's scope stay invisible. */
  assertRecordAccess(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
    ownerId: string | null | undefined,
  ): void {
    if (!this.canAccessRecord(user, module, action, ownerId)) {
      throw new NotFoundException('NOT_FOUND');
    }
  }

  /**
   * Owner to store on create/update. Only users with ALL scope for the action
   * may assign a record to someone else; everyone else always owns it.
   */
  resolveOwnerId(
    user: AuthUser,
    module: PermissionModule,
    action: PermissionAction,
    requestedOwnerId: string | null | undefined,
  ): string {
    if (requestedOwnerId && this.canAll(user, module, action)) {
      return requestedOwnerId;
    }
    return user.userId;
  }
}
