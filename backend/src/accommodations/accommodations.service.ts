import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateAccommodationDto,
  GetAccommodationsQueryDto,
  UpdateAccommodationDto,
  AccommodationType,
} from './dto/accommodations.dto';
import { FileUploadService } from '@/common/utils/file-upload.util';

@Injectable()
export class AccommodationsService {
  private readonly FALLBACK_LOCALES = ['en', 'ka', 'ru', 'tr', 'ar'];

  private readonly DEFAULT_INCLUDE = {
    localizations: true,
    images: { orderBy: { order: 'asc' as const } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUploadService,
  ) {}

  async create(dto: CreateAccommodationDto) {
    const mainImageFile = await this.uploadMainImage(dto.mainImage);
    const galleryFiles = await this.uploadGalleryImages(dto.gallery);

    try {
      return await this.prisma.accommodation.create({
        data: {
          type: dto.type,
          price: dto.price,
          city: dto.city,
          maxGuests: dto.maxGuests ?? 1,
          bedrooms: dto.bedrooms ?? 1,
          bathrooms: dto.bathrooms ?? 1,
          amenities: dto.amenities ?? [],
          isPublic: dto.isPublic ?? false,
          mainImage: mainImageFile.url,
          localizations: {
            create: dto.localizations.map((loc) => ({
              locale: loc.locale,
              name: loc.name,
              description: loc.description,
              address: loc.address || '',
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
        },
        include: this.DEFAULT_INCLUDE,
      });
    } catch (error) {
      await this.cleanupUploadedFiles(mainImageFile, galleryFiles);
      throw error;
    }
  }

  async findAll(
    query: GetAccommodationsQueryDto,
    publicOnly = false,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      type,
      locale,
      search,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where = this.buildWhereClause({
      type,
      search,
      city,
      publicOnly,
    });
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.DEFAULT_INCLUDE,
      }),
      this.prisma.accommodation.count({ where }),
    ]);

    // Pick the requested locale with fallback so an item is never hidden
    // just because a translation is missing
    const processed = items.map((item) =>
      this.applyLocaleWithFallback(item, locale),
    );

    return {
      data: processed,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, locale?: string) {
    const item = await this.prisma.accommodation.findUnique({
      where: { id },
      include: this.DEFAULT_INCLUDE,
    });

    if (!item) {
      throw new NotFoundException(`Accommodation with ID ${id} not found`);
    }

    return this.applyLocaleWithFallback(item, locale);
  }

  async update(id: string, dto: UpdateAccommodationDto) {
    const existing = await this.prisma.accommodation.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Accommodation not found');
    }

    const updateData: Prisma.AccommodationUpdateInput = {
      type: dto.type,
      price: dto.price,
      city: dto.city,
      maxGuests: dto.maxGuests,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      amenities: dto.amenities,
      isPublic: dto.isPublic,
    };

    if (dto.localizations) {
      updateData.localizations = {
        deleteMany: {},
        create: dto.localizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
          address: loc.address || '',
        })),
      };
    }

    if (dto.mainImage?.startsWith('data:image/')) {
      const newImage = await this.uploadMainImage(dto.mainImage);
      updateData.mainImage = newImage.url;
      await this.deleteMainImage(existing.mainImage);
    }

    if (dto.gallery !== undefined) {
      if (dto.gallery.length === 0) {
        if (existing.images.length > 0) {
          await this.deleteGalleryImages(existing.images);
        }
        updateData.images = { deleteMany: {} };
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

        const removedImages = existing.images.filter(
          (img) => !existingUrls.includes(img.url),
        );

        if (removedImages.length > 0) {
          await this.deleteGalleryImages(removedImages);
        }

        updateData.images = {
          deleteMany: {},
          create: [
            ...existingUrls.map((url, index) => ({ url, order: index })),
            ...uploadedFiles.map((file, index) => ({
              url: file.url,
              order: existingUrls.length + index,
            })),
          ],
        };
      }
    }

    return this.prisma.accommodation.update({
      where: { id },
      data: updateData,
      include: this.DEFAULT_INCLUDE,
    });
  }

  async remove(id: string) {
    const item = await this.prisma.accommodation.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!item) {
      throw new NotFoundException(`Accommodation with ID ${id} not found`);
    }

    await this.deleteMainImage(item.mainImage);
    await this.deleteGalleryImages(item.images);

    await this.prisma.accommodation.delete({ where: { id } });

    return { success: true };
  }

  private async uploadMainImage(base64: string) {
    return this.fileUpload.uploadBase64Image(base64, 'accommodations');
  }

  private async uploadGalleryImages(gallery?: string[]) {
    if (!gallery?.length) return [];
    return this.fileUpload.uploadBase64Images(
      gallery,
      'accommodations/gallery',
    );
  }

  private buildWhereClause(params: {
    type?: AccommodationType;
    search?: string;
    city?: string;
    publicOnly: boolean;
  }): Prisma.AccommodationWhereInput {
    const { type, search, city, publicOnly } = params;
    const where: Prisma.AccommodationWhereInput = {};

    if (publicOnly) {
      where.isPublic = true;
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Match against any localization so items stay visible regardless of
    // which languages the admin has filled in
    if (search) {
      where.localizations = {
        some: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    return where;
  }

  private buildOrderBy(sortBy: string, sortOrder: string) {
    const orderByField =
      sortBy as keyof Prisma.AccommodationOrderByWithRelationInput;
    return { [orderByField]: sortOrder };
  }

  /**
   * Return the item with only the best-matching localization:
   * requested locale → fallback locales → first available.
   * Without a requested locale, all localizations are returned (admin).
   */
  private applyLocaleWithFallback(item: any, locale?: string) {
    if (!item || !locale || !item.localizations?.length) {
      return item;
    }

    let localization = item.localizations.find(
      (loc: any) => loc.locale === locale,
    );

    if (!localization) {
      for (const fallbackLocale of this.FALLBACK_LOCALES) {
        localization = item.localizations.find(
          (loc: any) => loc.locale === fallbackLocale,
        );
        if (localization) break;
      }
    }

    if (!localization) {
      localization = item.localizations[0];
    }

    return {
      ...item,
      localizations: [localization],
    };
  }

  private async deleteMainImage(imagePath: string) {
    await this.fileUpload.deleteFile(imagePath);
  }

  private async deleteGalleryImages(images: { url: string }[]) {
    await this.fileUpload.deleteFiles(images.map((img) => img.url));
  }

  private async cleanupUploadedFiles(
    mainImageFile: { path: string },
    galleryFiles: { path: string }[],
  ) {
    await this.deleteMainImage(mainImageFile.path);
    await this.fileUpload.deleteFiles(galleryFiles.map((f) => f.path));
  }
}
