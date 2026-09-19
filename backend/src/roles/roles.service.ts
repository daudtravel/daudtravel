import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import { normalizeRolePermission } from '@/access/effective-permissions';
import {
  CreateRoleDto,
  ROLE_SORT_FIELDS,
  RolePermissionDto,
  UpdateRoleDto,
} from './dto/roles.dto';

const ROLE_LIST_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  permissions: true,
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      ROLE_SORT_FIELDS,
      'name',
      'asc',
    );
    const where: Prisma.RoleWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: ROLE_LIST_SELECT,
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles.map((r) => this.format(r)),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Every role (id + name) for pickers. */
  async options() {
    const data = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return { data };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        ...ROLE_LIST_SELECT,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
          orderBy: { firstName: 'asc' },
        },
      },
    });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');
    const { users, ...rest } = role;
    return { ...this.format(rest), users };
  }

  async create(dto: CreateRoleDto) {
    await this.assertNameFree(dto.name);
    const permissions = this.preparePermissions(dto.permissions);

    try {
      const role = await this.prisma.role.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          permissions: { create: permissions },
        },
        select: ROLE_LIST_SELECT,
      });
      return this.format(role);
    } catch (error) {
      throw this.mapUniqueError(error);
    }
  }

  async update(id: string, dto: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ROLE_NOT_FOUND');
    if (dto.name !== undefined) await this.assertNameFree(dto.name, id);

    const permissions =
      dto.permissions !== undefined
        ? this.preparePermissions(dto.permissions)
        : undefined;

    try {
      const role = await this.prisma.$transaction(async (tx) => {
        if (permissions !== undefined) {
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
          if (permissions.length) {
            await tx.rolePermission.createMany({
              data: permissions.map((p) => ({ ...p, roleId: id })),
            });
          }
        }
        return tx.role.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
          },
          select: ROLE_LIST_SELECT,
        });
      });
      return this.format(role);
    } catch (error) {
      throw this.mapUniqueError(error);
    }
  }

  /** Deleting a role detaches it from its users (they lose its permissions). */
  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');
    await this.prisma.role.delete({ where: { id } });
    return { detachedUsers: role._count.users };
  }

  private preparePermissions(rows: RolePermissionDto[]) {
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.module)) {
        throw new BadRequestException('DUPLICATE_MODULE');
      }
      seen.add(row.module);
    }
    return rows
      .map((row) => normalizeRolePermission(row))
      .filter((row) => row.canView)
      .map(({ module, canView, canCreate, canEdit, canDelete, scope }) => ({
        module,
        canView,
        canCreate,
        canEdit,
        canDelete,
        scope,
      }));
  }

  private async assertNameFree(name: string, excludeId?: string) {
    const existing = await this.prisma.role.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('ROLE_NAME_EXISTS');
  }

  private format<
    T extends { _count: { users: number }; permissions: unknown[] },
  >(role: T) {
    const { _count, ...rest } = role;
    return { ...rest, userCount: _count.users };
  }

  private mapUniqueError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('ROLE_NAME_EXISTS');
    }
    return error;
  }
}
