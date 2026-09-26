import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
  VEHICLE_SORT_FIELDS,
} from './dto/vehicles.dto';

// Vehicles belong to the drivers section, so they share its permission module.
const MODULE = PermissionModule.DRIVERS;

const VEHICLE_SELECT = {
  id: true,
  type: true,
  brand: true,
  model: true,
  year: true,
  seats: true,
  plateNumber: true,
  color: true,
  ownership: true,
  isActive: true,
  notes: true,
  driverId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  driver: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.VehicleSelect;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private async assertDriverExists(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true },
    });
    if (!driver) throw new BadRequestException('DRIVER_NOT_FOUND');
  }

  async findAll(user: AuthUser, query: ListVehiclesQueryDto) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      VEHICLE_SORT_FIELDS,
      'createdAt',
      'desc',
    );

    const where: Prisma.VehicleWhereInput = {
      ...scope,
      ...(query.type && { type: query.type }),
      ...(query.ownership && { ownership: query.ownership }),
      ...(query.driverId && { driverId: query.driverId }),
      ...(query.hasDriver !== undefined &&
        (query.hasDriver ? { NOT: { driverId: null } } : { driverId: null })),
      ...(query.brand && {
        brand: { contains: query.brand, mode: 'insensitive' },
      }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.createdById && { createdById: query.createdById }),
      ...((query.minYear !== undefined || query.maxYear !== undefined) && {
        year: {
          ...(query.minYear !== undefined && { gte: query.minYear }),
          ...(query.maxYear !== undefined && { lte: query.maxYear }),
        },
      }),
      ...((query.minSeats !== undefined || query.maxSeats !== undefined) && {
        seats: {
          ...(query.minSeats !== undefined && { gte: query.minSeats }),
          ...(query.maxSeats !== undefined && { lte: query.maxSeats }),
        },
      }),
      ...(query.search && {
        OR: [
          { brand: { contains: query.search, mode: 'insensitive' } },
          { model: { contains: query.search, mode: 'insensitive' } },
          { plateNumber: { contains: query.search, mode: 'insensitive' } },
          { color: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          {
            driver: {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: VEHICLE_SELECT,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  /** Distinct brands inside the user's scope, for the brand filter. */
  async filterOptions(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const rows = await this.prisma.vehicle.findMany({
      where: scope,
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
      take: 500,
      select: { brand: true },
    });
    return { data: { brands: rows.map((r) => r.brand) } };
  }

  /** Minimal list for pickers (bookings, transfer orders…). */
  async options(user: AuthUser, driverId?: string) {
    const scope = this.access.scopeWhere(user, MODULE, 'view');
    const rows = await this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        ...(scope ?? {}),
        ...(driverId && { driverId }),
      },
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
      take: 500,
      select: {
        id: true,
        type: true,
        brand: true,
        model: true,
        year: true,
        seats: true,
        plateNumber: true,
        driverId: true,
      },
    });
    return { data: rows };
  }

  async findOne(user: AuthUser, id: string) {
    const row = await this.prisma.vehicle.findUnique({
      where: { id },
      select: VEHICLE_SELECT,
    });
    if (!row) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', row.createdById);
    return row;
  }

  async create(user: AuthUser, dto: CreateVehicleDto) {
    if (dto.driverId) await this.assertDriverExists(dto.driverId);

    return this.prisma.vehicle.create({
      data: {
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        year: dto.year ?? null,
        seats: dto.seats ?? 4,
        plateNumber: dto.plateNumber ?? null,
        color: dto.color ?? null,
        ownership: dto.ownership ?? 'DRIVER',
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
        driverId: dto.driverId ?? null,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: VEHICLE_SELECT,
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    if (dto.driverId) await this.assertDriverExists(dto.driverId);

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.seats !== undefined && { seats: dto.seats }),
        ...(dto.plateNumber !== undefined && { plateNumber: dto.plateNumber }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.ownership !== undefined && { ownership: dto.ownership }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.driverId !== undefined && { driverId: dto.driverId }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
      },
      select: VEHICLE_SELECT,
    });
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.vehicle.findUnique({
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

    await this.prisma.vehicle.delete({ where: { id } });
  }
}
