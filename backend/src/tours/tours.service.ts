import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateTourDto,
  GetToursQueryDto,
  TourType,
  UpdateTourDto,
} from './dto/tours.dto';
import { FileUploadService } from '@/common/utils/file-upload.util';

@Injectable()
export class ToursService {
  private readonly DEFAULT_INCLUDE = {
    localizations: true,
    images: { orderBy: { order: 'asc' as const } },
    groupPricing: true,
    individualPricing: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUploadService,
  ) {}

  async create(dto: CreateTourDto) {
    this.validateTourData(dto);

    const mainImageFile = await this.uploadMainImage(dto.mainImage);
    const galleryFiles = await this.uploadGalleryImages(dto.gallery);

    try {
      return await this.createTourInDatabase(dto, mainImageFile, galleryFiles);
    } catch (error) {
      await this.cleanupUploadedFiles(mainImageFile, galleryFiles);
      throw error;
    }
  }

  async findAll(
    query: GetToursQueryDto,
    publicOnly = false,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      type,
      locale,
      search,
      startLocation,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where = this.buildWhereClause({
      type,
      locale,
      search,
      startLocation,
      publicOnly,
    });
    const include = locale
      ? this.getLocaleInclude(locale)
      : this.DEFAULT_INCLUDE;
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [tours, total] = await Promise.all([
      this.prisma.tour.findMany({ where, skip, take: limit, orderBy, include }),
      this.prisma.tour.count({ where }),
    ]);

    // Apply default English fallback for each tour
    const processedTours = tours.map((tour) =>
      this.applyDefaultLocale(tour, locale),
    );

    return {
      data: processedTours,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, locale?: string) {
    const include = locale
      ? this.getLocaleInclude(locale)
      : this.DEFAULT_INCLUDE;

    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include,
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    return this.applyDefaultLocale(tour, locale);
  }

  async update(id: string, dto: UpdateTourDto) {
    const existingTour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        groupPricing: true,
        individualPricing: true,
        images: true,
      },
    });

    if (!existingTour) {
      throw new NotFoundException('Tour not found');
    }

    // Build the update data
    const updateData: any = {
      days: dto.days,
      nights: dto.nights,
      isPublic: dto.isPublic,
      isDaily: dto.isDaily,
    };

    // Handle localizations
    if (dto.localizations) {
      updateData.localizations = {
        deleteMany: {},
        create: dto.localizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
          startLocation: loc.startLocation,
          locations: loc.locations || [],
        })),
      };
    }

    if (dto.mainImage?.startsWith('data:image/')) {
      const newImage = await this.uploadMainImage(dto.mainImage);
      updateData.mainImage = newImage.url;

      await this.deleteMainImage(existingTour.mainImage);
    }
    if (dto.gallery !== undefined) {
      if (dto.gallery.length === 0) {
        if (existingTour.images.length > 0) {
          await this.deleteGalleryImages(existingTour.images);
        }

        updateData.images = {
          deleteMany: {},
        };
      } else {
        const newBase64Images = dto.gallery.filter((img) =>
          img.startsWith('data:image/'),
        );
        const existingUrls = dto.gallery.filter((img) =>
          img.startsWith('/uploads/'),
        );

        const uploadedFiles =
          newBase64Images.length > 0
            ? await this.uploadGalleryImages(newBase64Images)
            : [];

        const removedImages = existingTour.images.filter(
          (img: any) => !existingUrls.includes(img.url),
        );

        if (removedImages.length > 0) {
          await this.deleteGalleryImages(removedImages);
        }

        updateData.images = {
          deleteMany: {},
          create: [
            ...existingUrls.map((url, index) => ({
              url,
              order: index,
            })),

            ...uploadedFiles.map((file, index) => ({
              url: file.url,
              order: existingUrls.length + index,
            })),
          ],
        };
      }
    }

    if (existingTour.type === 'GROUP') {
      if (dto.groupPricing) {
        if (existingTour.groupPricing) {
          updateData.groupPricing = {
            update: {
              totalPrice: dto.groupPricing.totalPrice,
              reservationPrice: dto.groupPricing.reservationPrice,
              discountedPrice: dto.groupPricing.discountedPrice,
            },
          };
        } else {
          updateData.groupPricing = {
            create: {
              totalPrice: dto.groupPricing.totalPrice,
              reservationPrice: dto.groupPricing.reservationPrice,
              discountedPrice: dto.groupPricing.discountedPrice,
            },
          };
        }
      }

      if (existingTour.individualPricing) {
        updateData.individualPricing = { delete: true };
      }

      if (dto.startDate) {
        updateData.startDate = new Date(dto.startDate);
      }
    } else {
      if (dto.individualPricing) {
        if (existingTour.individualPricing) {
          updateData.individualPricing = {
            update: {
              seasonTotalPrice: dto.individualPricing.seasonTotalPrice,
              seasonReservationPrice:
                dto.individualPricing.seasonReservationPrice,
              seasonDiscountedPrice:
                dto.individualPricing.seasonDiscountedPrice,
              offSeasonTotalPrice: dto.individualPricing.offSeasonTotalPrice,
              offSeasonReservationPrice:
                dto.individualPricing.offSeasonReservationPrice,
              offSeasonDiscountedPrice:
                dto.individualPricing.offSeasonDiscountedPrice,
            },
          };
        } else {
          updateData.individualPricing = {
            create: {
              seasonTotalPrice: dto.individualPricing.seasonTotalPrice,
              seasonReservationPrice:
                dto.individualPricing.seasonReservationPrice,
              seasonDiscountedPrice:
                dto.individualPricing.seasonDiscountedPrice,
              offSeasonTotalPrice: dto.individualPricing.offSeasonTotalPrice,
              offSeasonReservationPrice:
                dto.individualPricing.offSeasonReservationPrice,
              offSeasonDiscountedPrice:
                dto.individualPricing.offSeasonDiscountedPrice,
            },
          };
        }
      }

      if (existingTour.groupPricing) {
        updateData.groupPricing = { delete: true };
      }

      if (dto.maxPersons) {
        updateData.maxPersons = dto.maxPersons;
      }
    }

    return this.prisma.tour.update({
      where: { id },
      data: updateData,
      include: {
        localizations: true,
        images: true,
        groupPricing: true,
        individualPricing: true,
      },
    });
  }

  async remove(id: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    await this.deleteMainImage(tour.mainImage);
    await this.deleteGalleryImages(tour.images);

    await this.prisma.tour.delete({ where: { id } });

    return { success: true };
  }

  private async uploadMainImage(base64: string) {
    return this.fileUpload.uploadBase64Image(base64, 'tours');
  }

  private async uploadGalleryImages(gallery?: string[]) {
    if (!gallery?.length) return [];
    return this.fileUpload.uploadBase64Images(gallery, 'tours/gallery');
  }

  private async createTourInDatabase(
    dto: CreateTourDto,
    mainImageFile: any,
    galleryFiles: any[],
  ) {
    return this.prisma.tour.create({
      data: {
        type: dto.type,
        days: dto.days,
        nights: dto.nights,
        maxPersons: dto.type === TourType.INDIVIDUAL ? dto.maxPersons : null,
        startDate:
          dto.type === TourType.GROUP && dto.startDate
            ? new Date(dto.startDate)
            : null,
        isPublic: dto.isPublic ?? false,
        isDaily: dto.isDaily ?? false,
        mainImage: mainImageFile.url,
        localizations: {
          create: dto.localizations.map((loc) => ({
            locale: loc.locale,
            name: loc.name,
            description: loc.description,
            startLocation: loc.startLocation,
            locations: loc.locations || [],
          })),
        },
        images: galleryFiles.length
          ? {
              create: galleryFiles.map((file, index) => ({
                url: file.url,
                order: index,
              })),
            }
          : undefined,
        groupPricing:
          dto.type === TourType.GROUP && dto.groupPricing
            ? { create: dto.groupPricing }
            : undefined,
        individualPricing:
          dto.type === TourType.INDIVIDUAL && dto.individualPricing
            ? { create: dto.individualPricing }
            : undefined,
      },
      include: this.DEFAULT_INCLUDE,
    });
  }

  private buildWhereClause(params: {
    type?: TourType;
    locale?: string;
    search?: string;
    startLocation?: string;
    publicOnly: boolean;
  }): Prisma.TourWhereInput {
    const { type, locale, search, startLocation, publicOnly } = params;
    const where: Prisma.TourWhereInput = {};

    if (publicOnly) {
      where.isPublic = true;
    }

    if (type) {
      where.type = type;
    }

    if (search || locale || startLocation) {
      where.localizations = {
        some: {
          ...(locale && { locale }),
          ...(startLocation && { startLocation }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { startLocation: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
      };
    }

    return where;
  }

  private buildOrderBy(sortBy: string, sortOrder: string) {
    const orderByField = sortBy as keyof Prisma.TourOrderByWithRelationInput;
    return { [orderByField]: sortOrder };
  }

  private getLocaleInclude(locale: string) {
    return {
      localizations: { where: { locale } },
      images: { orderBy: { order: 'asc' as const } },
      groupPricing: true,
      individualPricing: true,
    };
  }

  /**
   * Apply default English locale if requested locale is not available
   */
  private applyDefaultLocale(tour: any, requestedLocale?: string) {
    if (!tour || !tour.localizations) {
      return tour;
    }

    // If no locale was requested, return tour as is
    if (!requestedLocale) {
      return tour;
    }

    // If requested locale exists, return tour as is
    if (tour.localizations.length > 0) {
      return tour;
    }

    // Requested locale not found, fetch English as default
    // Re-fetch with English locale
    return this.fetchTourWithFallbackLocale(tour.id);
  }

  /**
   * Fetch tour with fallback to English locale
   */
  private async fetchTourWithFallbackLocale(tourId: string) {
    const tourWithEnglish = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        localizations: { where: { locale: 'en' } },
        images: { orderBy: { order: 'asc' as const } },
        groupPricing: true,
        individualPricing: true,
      },
    });

    // If English is also not available, return all localizations
    if (!tourWithEnglish || tourWithEnglish.localizations.length === 0) {
      return this.prisma.tour.findUnique({
        where: { id: tourId },
        include: this.DEFAULT_INCLUDE,
      });
    }

    return tourWithEnglish;
  }

  private validateTourData(dto: CreateTourDto | UpdateTourDto) {
    if (dto.type === TourType.GROUP && !dto.groupPricing) {
      throw new BadRequestException(
        'Group pricing is required for group tours',
      );
    }

    if (dto.type === TourType.INDIVIDUAL) {
      if (!dto.individualPricing) {
        throw new BadRequestException(
          'Individual pricing is required for individual tours',
        );
      }
      if (!dto.maxPersons) {
        throw new BadRequestException(
          'Max persons is required for individual tours',
        );
      }
    }
  }

  private async deleteMainImage(imagePath: string) {
    await this.fileUpload.deleteFile(imagePath);
  }

  private async deleteGalleryImages(images: any[]) {
    await this.fileUpload.deleteFiles(images.map((img) => img.url));
  }

  private async cleanupUploadedFiles(mainImageFile: any, galleryFiles: any[]) {
    await this.deleteMainImage(mainImageFile.path);
    await this.fileUpload.deleteFiles(galleryFiles.map((f) => f.path));
  }
}
