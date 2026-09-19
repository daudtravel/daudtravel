import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import type { AuthUser } from '@/access/access.types';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  CreateUserDto,
  ListUsersQueryDto,
  SetUserPasswordDto,
  UpdateUserDto,
  USER_SORT_FIELDS,
} from './dto/users.dto';
import {
  BCRYPT_ROUNDS,
  normalizeEmail,
  USER_PUBLIC_SELECT,
} from './users.constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      USER_SORT_FIELDS,
      'createdAt',
    );

    const where: Prisma.UserWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isAdmin !== undefined && { isAdmin: query.isAdmin }),
      ...(query.roleId && { roles: { some: { id: query.roleId } } }),
      ...(query.search && { AND: this.searchTerms(query.search) }),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      field === 'lastLoginAt'
        ? { lastLoginAt: { sort: order, nulls: 'last' } }
        : { [field]: order };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [orderBy, { id: 'asc' }],
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  /** Minimal list for owner / employee pickers and filters. */
  async lookup(includeInactive: boolean) {
    const data = await this.prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 500,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
    return { data };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  async create(dto: CreateUserDto) {
    const email = normalizeEmail(dto.email);
    await this.assertEmailFree(email);
    await this.assertRolesExist(dto.roleIds);

    try {
      return await this.prisma.user.create({
        data: {
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          position: dto.position ?? null,
          password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
          isVerified: true,
          isAdmin: dto.isAdmin ?? false,
          isActive: dto.isActive ?? true,
          roles: { connect: (dto.roleIds ?? []).map((id) => ({ id })) },
        },
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      throw this.mapUniqueError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const isSelf = id === actor.userId;
    if (isSelf && (dto.isAdmin === false || dto.isActive === false)) {
      throw new BadRequestException('CANNOT_MODIFY_SELF');
    }

    const willBeAdmin = dto.isAdmin ?? user.isAdmin;
    const willBeActive = dto.isActive ?? user.isActive;
    if (user.isAdmin && user.isActive && !(willBeAdmin && willBeActive)) {
      await this.assertAnotherActiveAdmin(id);
    }

    let email: string | undefined;
    if (dto.email !== undefined) {
      email = normalizeEmail(dto.email);
      if (email !== normalizeEmail(user.email)) {
        await this.assertEmailFree(email, id);
      }
    }

    await this.assertRolesExist(dto.roleIds);

    const deactivating = user.isActive && dto.isActive === false;

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(email !== undefined && { email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.position !== undefined && { position: dto.position }),
          ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.roleIds !== undefined && {
            roles: { set: dto.roleIds.map((roleId) => ({ id: roleId })) },
          }),
          // A re-activated account must sign in again.
          ...(deactivating && { sessionsRevokedAt: new Date() }),
        },
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      throw this.mapUniqueError(error);
    }
  }

  async setPassword(id: string, dto: SetUserPasswordDto, actor: AuthUser) {
    if (id === actor.userId) {
      // Own password goes through /auth/me/password (needs the current one).
      throw new BadRequestException('CANNOT_MODIFY_SELF');
    }
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        sessionsRevokedAt: new Date(),
      },
    });
  }

  async remove(id: string, actor: AuthUser) {
    if (id === actor.userId) {
      throw new BadRequestException('CANNOT_MODIFY_SELF');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.isAdmin && user.isActive) {
      await this.assertAnotherActiveAdmin(id);
    }
    await this.prisma.user.delete({ where: { id } });
  }

  private searchTerms(search: string): Prisma.UserWhereInput[] {
    return search
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .map((term) => ({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { position: { contains: term, mode: 'insensitive' } },
        ],
      }));
  }

  private async assertEmailFree(email: string, excludeId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('EMAIL_EXISTS');
  }

  private async assertRolesExist(roleIds?: string[]) {
    if (!roleIds?.length) return;
    const count = await this.prisma.role.count({
      where: { id: { in: roleIds } },
    });
    if (count !== roleIds.length) {
      throw new BadRequestException('ROLE_NOT_FOUND');
    }
  }

  private async assertAnotherActiveAdmin(excludeId: string) {
    const others = await this.prisma.user.count({
      where: { isAdmin: true, isActive: true, id: { not: excludeId } },
    });
    if (others === 0) throw new BadRequestException('LAST_ADMIN');
  }

  private mapUniqueError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('EMAIL_EXISTS');
    }
    return error;
  }
}
