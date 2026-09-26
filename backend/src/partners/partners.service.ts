import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import type { AuthUser } from '@/access/access.types';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import {
  CreatePartnerDto,
  ListPartnersQueryDto,
  PARTNER_SORT_FIELDS,
  UpdatePartnerDto,
} from './dto/partners.dto';

const MODULE = PermissionModule.PARTNERS;

const PARTNER_SELECT = {
  id: true,
  name: true,
  type: true,
  phone: true,
  email: true,
  commissionRate: true,
  notes: true,
  isActive: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PartnerSelect;

type PartnerRow = Prisma.PartnerGetPayload<{ select: typeof PARTNER_SELECT }>;

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private format(row: PartnerRow) {
    return { ...row, commissionRate: Number(row.commissionRate) };
  }

  async findAll(user: AuthUser, query: ListPartnersQueryDto) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      PARTNER_SORT_FIELDS,
      'name',
      'asc',
    );

    const where: Prisma.PartnerWhereInput = {
      ...scope,
      ...(query.type && { type: query.type }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      // An "all records" user can narrow the list down to one owner
      ...(query.createdById && { createdById: query.createdById }),
      ...((query.minRate !== undefined || query.maxRate !== undefined) && {
        commissionRate: {
          ...(query.minRate !== undefined && { gte: query.minRate }),
          ...(query.maxRate !== undefined && { lte: query.maxRate }),
        },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: PARTNER_SELECT,
      }),
      this.prisma.partner.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.format(row)),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Minimal list for pickers (bookings, drivers…), within the user's scope. */
  async options(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view');
    const rows = await this.prisma.partner.findMany({
      where: { isActive: true, ...(scope ?? {}) },
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, name: true, commissionRate: true, type: true },
    });
    return {
      data: rows.map((row) => ({
        ...row,
        commissionRate: Number(row.commissionRate),
      })),
    };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.partner.findUnique({
      where: { id },
      select: PARTNER_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', row.createdById);
    return this.format(row);
  }

  async create(user: AuthUser, dto: CreatePartnerDto) {
    const row = await this.prisma.partner.create({
      data: {
        name: dto.name,
        type: dto.type ?? 'AGENT',
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        commissionRate: new Prisma.Decimal(dto.commissionRate ?? 0),
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: PARTNER_SELECT,
    });
    return this.format(row);
  }

  async update(user: AuthUser, id: string, dto: UpdatePartnerDto) {
    const existing = await this.prisma.partner.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    const row = await this.prisma.partner.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.commissionRate !== undefined && {
          commissionRate: new Prisma.Decimal(dto.commissionRate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
      },
      select: PARTNER_SELECT,
    });
    return this.format(row);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.partner.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      MODULE,
      'delete',
      existing.createdById,
    );
    await this.prisma.partner.delete({ where: { id } });
  }
}
