import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AccessService } from '@/access/access.service';
import { ACCESS_RULE_KEY } from '@/access/access.decorators';
import { AccessRule, AuthUser } from '@/access/access.types';

/**
 * Verifies the JWT, reloads the user (active, roles, permissions) from the DB
 * and enforces the route's access rule. Routes without an explicit rule
 * (@RequirePermission / @RequireAnyPermission / @AuthenticatedOnly) are
 * super-admin only.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    let payload: { userId?: unknown; iat?: number };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.accessService.loadAuthUser(payload.userId);
    if (!user) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    // Tokens issued before a password change / reset / deactivation are dead.
    if (
      user.sessionsRevokedAt &&
      typeof payload.iat === 'number' &&
      payload.iat < Math.floor(user.sessionsRevokedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('SESSION_INVALID');
    }

    const authUser: AuthUser = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      roles: user.roles,
      permissions: user.permissions,
    };
    request.user = authUser;

    const rule = this.reflector.getAllAndOverride<AccessRule | undefined>(
      ACCESS_RULE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? { kind: 'superAdmin' };

    if (!this.accessService.satisfies(authUser, rule)) {
      throw new ForbiddenException('FORBIDDEN');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
