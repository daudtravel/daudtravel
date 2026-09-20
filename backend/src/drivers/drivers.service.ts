import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionModule, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import type { AuthUser, PermissionAction } from '@/access/access.types';
import { FileUploadService } from '@/common/utils/file-upload.util';
import {
  buildMeta,
  resolvePagination,
  resolveSort,
} from '@/common/utils/pagination.util';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import {
  CreateDriverDto,
  DRIVER_SORT_FIELDS,
  ListDriversQueryDto,
  UpdateDriverDto,
} from './dto/drivers.dto';

const MODULE = PermissionModule.DRIVERS;

/** What the public website is allowed to see. */
const PUBLIC_WHERE = { showOnWebsite: true, isActive: true } as const;

const VEHICLE_SUMMARY = {
  id: true,
  type: true,
  brand: true,
  model: true,
  year: true,
  seats: true,
  plateNumber: true,
  ownership: true,
  isActive: true,
} satisfies Prisma.VehicleSelect;

const DRIVER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  photo: true,
  languages: true,
  dailyRentPrice: true,
  carPhotos: true,
  phone: true,
  email: true,
  notes: true,
  isActive: true,
  showOnWebsite: true,
  referrerId: true,
  referrerCommissionRate: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  referrer: { select: { id: true, name: true, type: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  vehicles: {
    orderBy: [{ isActive: 'desc' as const }, { createdAt: 'asc' as const }],
    select: VEHICLE_SUMMARY,
  },
  _count: { select: { reviews: true, vehicles: true, paymentOrders: true } },
} satisfies Prisma.DriverSelect;

type DriverRow = Prisma.DriverGetPayload<{ select: typeof DRIVER_SELECT }>;

interface RatingSummary {
  averageRating: number | null;
  totalReviews: number;
}

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // ---------------------------------------------------------------- helpers

  /**
   * Average rating over ALL reviews of the given drivers (the old code averaged
   * only the five reviews it had included, which under-counted busy drivers).
   */
  private async ratingsFor(
    driverIds: string[],
  ): Promise<Map<string, RatingSummary>> {
    const map = new Map<string, RatingSummary>();
    if (driverIds.length === 0) return map;

    const grouped = await this.prisma.driverReview.groupBy({
      by: ['driverId'],
      where: { driverId: { in: driverIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    for (const row of grouped) {
      map.set(row.driverId, {
        averageRating:
          row._avg.rating !== null ? Number(row._avg.rating.toFixed(1)) : null,
        totalReviews: row._count._all,
      });
    }
    return map;
  }

  /** Website shape — unchanged fields, no back-office data. */
  private formatPublic(
    driver: {
      id: string;
      firstName: string;
      lastName: string;
      photo: string | null;
      languages: string[];
      dailyRentPrice: Prisma.Decimal | null;
      carPhotos: string[];
      createdAt: Date;
      updatedAt: Date;
      reviews?: unknown[];
    },
    rating: RatingSummary | undefined,
  ) {
    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      photo: driver.photo ?? null,
      languages: driver.languages ?? [],
      dailyRentPrice:
        driver.dailyRentPrice !== null && driver.dailyRentPrice !== undefined
          ? Number(driver.dailyRentPrice)
          : null,
      carPhotos: driver.carPhotos ?? [],
      averageRating: rating?.averageRating ?? null,
      totalReviews: rating?.totalReviews ?? 0,
      recentReviews: driver.reviews ?? [],
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }

  private formatAdmin(driver: DriverRow, rating: RatingSummary | undefined) {
    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      photo: driver.photo,
      languages: driver.languages,
      dailyRentPrice:
        driver.dailyRentPrice !== null ? Number(driver.dailyRentPrice) : null,
      carPhotos: driver.carPhotos,
      phone: driver.phone,
      email: driver.email,
      notes: driver.notes,
      isActive: driver.isActive,
      showOnWebsite: driver.showOnWebsite,
      referrerId: driver.referrerId,
      referrer: driver.referrer,
      referrerCommissionRate:
        driver.referrerCommissionRate !== null
          ? Number(driver.referrerCommissionRate)
          : null,
      createdById: driver.createdById,
      createdBy: driver.createdBy,
      vehicles: driver.vehicles,
      counts: {
        reviews: driver._count.reviews,
        vehicles: driver._count.vehicles,
        transferOrders: driver._count.paymentOrders,
      },
      averageRating: rating?.averageRating ?? null,
      totalReviews: rating?.totalReviews ?? driver._count.reviews,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }

  /** Loads a driver the user may act on, or 404 (never reveals it exists). */
  private async loadForAction(
    user: AuthUser,
    id: string,
    action: PermissionAction,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      select: { id: true, createdById: true, photo: true, carPhotos: true },
    });
    if (!driver) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, action, driver.createdById);
    return driver;
  }

  private canPublish(user: AuthUser) {
    return this.access.can(user, PermissionModule.WEBSITE, 'edit');
  }

  /**
   * Website visibility may only be changed by someone who maintains the public
   * site; for everyone else a new driver stays internal.
   */
  private resolveShowOnWebsite(
    user: AuthUser,
    provided: boolean | undefined,
    fallback: boolean,
  ): boolean {
    if (provided === undefined) return fallback;
    if (!this.canPublish(user)) {
      throw new ForbiddenException('WEBSITE_EDIT_REQUIRED');
    }
    return provided;
  }

  private async assertReferrerExists(referrerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: referrerId },
      select: { id: true },
    });
    if (!partner) throw new BadRequestException('PARTNER_NOT_FOUND');
  }

  private async uploadPhoto(file: Express.Multer.File) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploaded = await this.fileUploadService.uploadBase64Image(
      base64,
      'drivers',
    );
    return uploaded.url;
  }

  // ----------------------------------------------------------------- public

  async findAllPublic() {
    const drivers = await this.prisma.driver.findMany({
      where: PUBLIC_WHERE,
      orderBy: { createdAt: 'desc' },
      include: { reviews: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    const ratings = await this.ratingsFor(drivers.map((d) => d.id));

    return {
      count: drivers.length,
      drivers: drivers.map((d) => this.formatPublic(d, ratings.get(d.id))),
    };
  }

  async findOnePublic(id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, ...PUBLIC_WHERE },
      include: { reviews: { orderBy: { createdAt: 'desc' } } },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const ratings = await this.ratingsFor([driver.id]);
    return this.formatPublic(driver, ratings.get(driver.id));
  }

  async createReview(driverId: string, dto: CreateDriverReviewDto) {
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId, ...PUBLIC_WHERE },
      select: { id: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    return this.prisma.driverReview.create({
      data: {
        driverId,
        rating: dto.rating,
        comment: dto.comment,
        reviewerName: dto.reviewerName,
      },
    });
  }

  async getReviews(driverId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId, ...PUBLIC_WHERE },
      select: { id: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    return this.reviewsOf(driverId);
  }

  private async reviewsOf(driverId: string) {
    const reviews = await this.prisma.driverReview.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);

    return {
      driverId,
      averageRating:
        reviews.length > 0 ? Number((total / reviews.length).toFixed(1)) : null,
      totalReviews: reviews.length,
      reviews,
    };
  }

  // ------------------------------------------------------------ back office

  async findAllAdmin(user: AuthUser, query: ListDriversQueryDto) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { field, order } = resolveSort(
      query.sortBy,
      query.sortOrder,
      DRIVER_SORT_FIELDS,
      'createdAt',
      'desc',
    );

    const vehicleFilters: Prisma.VehicleWhereInput = {
      ...(query.vehicleType && { type: query.vehicleType }),
    };
    const hasVehicleFilter =
      query.hasVehicle !== undefined || query.vehicleType !== undefined;

    const where: Prisma.DriverWhereInput = {
      ...scope,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.showOnWebsite !== undefined && {
        showOnWebsite: query.showOnWebsite,
      }),
      ...(query.referrerId && { referrerId: query.referrerId }),
      ...(query.createdById && { createdById: query.createdById }),
      ...(query.language && { languages: { has: query.language } }),
      ...(hasVehicleFilter &&
        (query.hasVehicle === false
          ? { vehicles: { none: vehicleFilters } }
          : { vehicles: { some: vehicleFilters } })),
      ...((query.minRent !== undefined || query.maxRent !== undefined) && {
        dailyRentPrice: {
          ...(query.minRent !== undefined && { gte: query.minRent }),
          ...(query.maxRent !== undefined && { lte: query.maxRent }),
        },
      }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          {
            vehicles: {
              some: {
                OR: [
                  { brand: { contains: query.search, mode: 'insensitive' } },
                  { model: { contains: query.search, mode: 'insensitive' } },
                  {
                    plateNumber: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [field]: order }, { id: 'asc' }],
        select: DRIVER_SELECT,
      }),
      this.prisma.driver.count({ where }),
    ]);

    const ratings = await this.ratingsFor(rows.map((r) => r.id));

    return {
      data: rows.map((row) => this.formatAdmin(row, ratings.get(row.id))),
      meta: buildMeta(total, page, limit),
    };
  }

  /** Distinct languages inside the user's scope, for the language filter. */
  async filterOptions(user: AuthUser) {
    const scope = this.access.scopeWhere(user, MODULE, 'view') ?? {};
    const rows = await this.prisma.driver.findMany({
      where: scope,
      select: { languages: true },
      take: 2000,
    });

    const languages = [...new Set(rows.flatMap((r) => r.languages))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return { data: { languages } };
  }

  /** Minimal list for pickers (assign a driver, vehicles, bookings…). */
  async options(user: AuthUser, search?: string) {
    // Assigning a driver to a website order needs every driver, not just the
    // ones this user created.
    const scope = this.access.can(user, PermissionModule.ONLINE_ORDERS, 'edit')
      ? null
      : this.access.scopeWhere(user, MODULE, 'view');
    const rows = await this.prisma.driver.findMany({
      where: {
        isActive: true,
        ...(scope ?? {}),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 500,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        // So a booking can offer the driver-referral commission straight away
        referrerId: true,
        referrerCommissionRate: true,
        referrer: { select: { id: true, name: true } },
        vehicles: {
          where: { isActive: true },
          select: { id: true, type: true, brand: true, model: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return {
      data: rows.map((row) => ({
        ...row,
        referrerCommissionRate:
          row.referrerCommissionRate !== null
            ? Number(row.referrerCommissionRate)
            : null,
      })),
    };
  }

  async findOneAdmin(user: AuthUser, id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      select: DRIVER_SELECT,
    });
    if (!driver) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'view', driver.createdById);

    const ratings = await this.ratingsFor([driver.id]);
    const reviews = await this.reviewsOf(driver.id);

    return {
      ...this.formatAdmin(driver, ratings.get(driver.id)),
      reviews: reviews.reviews,
    };
  }

  async create(
    user: AuthUser,
    dto: CreateDriverDto,
    file?: Express.Multer.File,
  ) {
    if (dto.referrerId) await this.assertReferrerExists(dto.referrerId);

    const showOnWebsite = this.resolveShowOnWebsite(
      user,
      dto.showOnWebsite,
      this.canPublish(user),
    );

    const photo = file ? await this.uploadPhoto(file) : undefined;

    const driver = await this.prisma.driver.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        photo,
        languages: dto.languages ?? [],
        dailyRentPrice:
          dto.dailyRentPrice !== undefined && dto.dailyRentPrice !== null
            ? new Prisma.Decimal(dto.dailyRentPrice)
            : null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
        showOnWebsite,
        referrerId: dto.referrerId ?? null,
        referrerCommissionRate:
          dto.referrerCommissionRate !== undefined &&
          dto.referrerCommissionRate !== null
            ? new Prisma.Decimal(dto.referrerCommissionRate)
            : null,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: DRIVER_SELECT,
    });

    return this.formatAdmin(driver, undefined);
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateDriverDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.loadForAction(user, id, 'edit');
    if (dto.referrerId) await this.assertReferrerExists(dto.referrerId);

    const showOnWebsite =
      dto.showOnWebsite !== undefined
        ? this.resolveShowOnWebsite(user, dto.showOnWebsite, false)
        : undefined;

    const photo = file ? await this.uploadPhoto(file) : undefined;
    // A new photo replaces the old one; "remove" alone clears it.
    const clearPhoto = !photo && dto.removePhoto === true && !!existing.photo;

    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.languages !== undefined && { languages: dto.languages }),
        ...(dto.dailyRentPrice !== undefined && {
          dailyRentPrice:
            dto.dailyRentPrice === null
              ? null
              : new Prisma.Decimal(dto.dailyRentPrice),
        }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(showOnWebsite !== undefined && { showOnWebsite }),
        ...(dto.referrerId !== undefined && { referrerId: dto.referrerId }),
        ...(dto.referrerCommissionRate !== undefined && {
          referrerCommissionRate:
            dto.referrerCommissionRate === null
              ? null
              : new Prisma.Decimal(dto.referrerCommissionRate),
        }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
        ...(photo && { photo }),
        ...(clearPhoto && { photo: null }),
      },
      select: DRIVER_SELECT,
    });

    // Only after the record is safely updated
    if ((photo || clearPhoto) && existing.photo) {
      await this.fileUploadService.deleteFile(existing.photo);
    }

    const ratings = await this.ratingsFor([id]);
    return this.formatAdmin(driver, ratings.get(id));
  }

  async addCarPhotos(user: AuthUser, id: string, files: Express.Multer.File[]) {
    const driver = await this.loadForAction(user, id, 'edit');

    if (!files || files.length === 0) {
      throw new BadRequestException('NO_PHOTOS');
    }

    const urls: string[] = [];
    for (const file of files) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploaded = await this.fileUploadService.uploadBase64Image(
        base64,
        'drivers/cars',
      );
      urls.push(uploaded.url);
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { carPhotos: [...driver.carPhotos, ...urls] },
      select: { carPhotos: true },
    });

    return updated.carPhotos;
  }

  async removeCarPhoto(user: AuthUser, id: string, url: string) {
    const driver = await this.loadForAction(user, id, 'edit');

    if (!driver.carPhotos.includes(url)) {
      throw new NotFoundException('PHOTO_NOT_FOUND');
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { carPhotos: driver.carPhotos.filter((p) => p !== url) },
      select: { carPhotos: true },
    });

    await this.fileUploadService.deleteFile(url);

    return updated.carPhotos;
  }

  async remove(user: AuthUser, id: string) {
    const driver = await this.loadForAction(user, id, 'delete');

    const [vehicles, transferOrders] = await Promise.all([
      this.prisma.vehicle.count({ where: { driverId: id } }),
      this.prisma.transferPaymentOrder.count({ where: { driverId: id } }),
    ]);

    // Deleting would silently detach these; the UI offers "deactivate" instead.
    if (vehicles > 0 || transferOrders > 0) {
      throw new ConflictException({
        message: 'IN_USE',
        counts: { vehicles, transferOrders },
      });
    }

    await this.prisma.driver.delete({ where: { id } });

    if (driver.photo) await this.fileUploadService.deleteFile(driver.photo);
    if (driver.carPhotos.length > 0) {
      await this.fileUploadService.deleteFiles(driver.carPhotos);
    }
  }

  async adminReviews(user: AuthUser, id: string) {
    await this.loadForAction(user, id, 'view');
    return this.reviewsOf(id);
  }

  async deleteReview(user: AuthUser, reviewId: string) {
    const review = await this.prisma.driverReview.findUnique({
      where: { id: reviewId },
      select: { id: true, driverId: true },
    });
    if (!review) throw new NotFoundException('NOT_FOUND');

    await this.loadForAction(user, review.driverId, 'edit');
    await this.prisma.driverReview.delete({ where: { id: reviewId } });
  }

  /**
   * Month-by-month website transfer jobs assigned to this driver. Booking-based
   * earnings and payouts join this view once bookings exist.
   */
  async monthly(user: AuthUser, id: string, year?: number) {
    await this.loadForAction(user, id, 'view');

    const currentYear = new Date().getUTCFullYear();
    const target = year ?? currentYear;
    const from = new Date(Date.UTC(target, 0, 1));
    const to = new Date(Date.UTC(target + 1, 0, 1));

    const [orders, span] = await Promise.all([
      this.prisma.transferPaymentOrder.findMany({
        where: {
          driverId: id,
          status: 'PAID',
          transferDate: { gte: from, lt: to },
        },
        orderBy: { transferDate: 'asc' },
        select: {
          id: true,
          transferDate: true,
          transferTime: true,
          paymentAmount: true,
          passengerCount: true,
          vehicleType: true,
          transferStartLocation: true,
          transferEndLocation: true,
          customerFirstName: true,
          customerLastName: true,
        },
      }),
      this.prisma.transferPaymentOrder.aggregate({
        where: { driverId: id, status: 'PAID' },
        _min: { transferDate: true },
        _max: { transferDate: true },
      }),
    ]);

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      transferJobs: 0,
      transferRevenue: 0,
    }));

    for (const order of orders) {
      const bucket = months[order.transferDate.getUTCMonth()];
      bucket.transferJobs += 1;
      bucket.transferRevenue += Number(order.paymentAmount);
    }

    const firstYear = span._min.transferDate?.getUTCFullYear();
    const lastYear = span._max.transferDate?.getUTCFullYear();
    const years = new Set<number>([currentYear, target]);
    if (firstYear && lastYear) {
      for (let y = firstYear; y <= lastYear; y += 1) years.add(y);
    }

    return {
      driverId: id,
      year: target,
      availableYears: [...years].sort((a, b) => b - a),
      months: months.map((m) => ({
        ...m,
        transferRevenue: Number(m.transferRevenue.toFixed(2)),
      })),
      totals: {
        transferJobs: orders.length,
        transferRevenue: Number(
          orders
            .reduce((sum, o) => sum + Number(o.paymentAmount), 0)
            .toFixed(2),
        ),
      },
      jobs: orders.map((o) => ({
        ...o,
        paymentAmount: Number(o.paymentAmount),
      })),
    };
  }
}
