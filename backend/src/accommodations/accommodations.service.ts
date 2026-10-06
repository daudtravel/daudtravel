import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionModule, Prisma } from '@prisma/client';
import { AccessService } from '@/access/access.service';
import type { AuthUser } from '@/access/access.types';
import {
  ACCOMMODATION_SORT_FIELDS,
  CreateAccommodationDto,
  GetAccommodationsQueryDto,
  UpdateAccommodationDto,
  AccommodationType,
} from './dto/accommodations.dto';
import { FileUploadService } from '@/common/utils/file-upload.util';
import { resolveSort } from '@/common/utils/pagination.util';
import {
  collectCustomRoomTypes,
  customRoomTypeSpellings,
  listingRoomTypeWhere,
  mergeListingRoomTypes,
  toRoomType,
} from '@/common/utils/room-types.util';

/** The hotel-directory entry filled from a listing (Hotel.accommodationId). */
type DirectoryEntryRef = { id: string; createdById: string | null };

@Injectable()
export class AccommodationsService {
  private readonly FALLBACK_LOCALES = ['en', 'ka', 'ru', 'tr', 'ar'];

  private readonly DEFAULT_INCLUDE = {
    localizations: true,
    images: { orderBy: { order: 'asc' as const } },
  };

  /** Admin rows also name the hotel-directory entry filled from a listing. */
  private readonly ADMIN_INCLUDE = {
    ...this.DEFAULT_INCLUDE,
    hotel: { select: { id: true, createdById: true } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUploadService,
    private readonly access: AccessService,
  ) {}

  /**
   * A listing's directory entry as the caller may see it: that there is one,
   * and its id only for someone allowed to open that entry (HOTELS scope).
   */
  private directoryEntry(
    user: AuthUser | undefined,
    hotel: DirectoryEntryRef | null | undefined,
  ) {
    if (!hotel) return null;
    const canOpen =
      !!user &&
      this.access.canAccessRecord(
        user,
        PermissionModule.HOTELS,
        'view',
        hotel.createdById,
      );
    return { id: canOpen ? hotel.id : null };
  }

  async create(dto: CreateAccommodationDto) {
    const { roomTypes, customRoomTypes } = mergeListingRoomTypes(
      dto.roomTypes ?? [],
      dto.localizations.map((loc) => loc.customRoomTypes),
    );
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
          roomTypes,
          isPublic: dto.isPublic ?? false,
          mainImage: mainImageFile.url,
          localizations: {
            create: dto.localizations.map((loc, index) => ({
              locale: loc.locale,
              name: loc.name,
              description: loc.description,
              address: loc.address || '',
              customRoomTypes: customRoomTypes[index],
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
    user?: AuthUser,
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
      isPublic,
      minPrice,
      maxPrice,
      roomType,
      inDirectory,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where = this.buildWhereClause({
      type,
      search,
      city,
      isPublic,
      minPrice,
      maxPrice,
      roomType,
      roomTypeSpellings: roomType
        ? await this.findRoomTypeSpellings(roomType)
        : undefined,
      inDirectory,
      publicOnly,
    });
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        // The public list is unauthenticated: no back-office data there
        include: publicOnly ? this.DEFAULT_INCLUDE : this.ADMIN_INCLUDE,
      }),
      this.prisma.accommodation.count({ where }),
    ]);

    // Pick the requested locale with fallback so an item is never hidden
    // just because a translation is missing
    const processed = items.map((item) =>
      this.applyLocaleWithFallback(
        publicOnly
          ? item
          : {
              ...item,
              hotel: this.directoryEntry(
                user,
                (item as { hotel?: DirectoryEntryRef | null }).hotel,
              ),
            },
        locale,
      ),
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
      include: {
        images: true,
        localizations: { select: { locale: true, customRoomTypes: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Accommodation not found');
    }

    // A language sent without its custom room types keeps the stored ones
    const { roomTypes, customRoomTypes } = mergeListingRoomTypes(
      dto.roomTypes,
      (dto.localizations ?? []).map(
        (loc) =>
          loc.customRoomTypes ??
          existing.localizations.find((stored) => stored.locale === loc.locale)
            ?.customRoomTypes,
      ),
      existing.roomTypes,
    );

    const updateData: Prisma.AccommodationUpdateInput = {
      type: dto.type,
      price: dto.price,
      city: dto.city,
      maxGuests: dto.maxGuests,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      amenities: dto.amenities,
      roomTypes,
      isPublic: dto.isPublic,
    };

    if (dto.localizations) {
      updateData.localizations = {
        deleteMany: {},
        create: dto.localizations.map((loc, index) => ({
          locale: loc.locale,
          name: loc.name,
          description: loc.description,
          address: loc.address || '',
          customRoomTypes: customRoomTypes[index],
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
    isPublic?: boolean;
    minPrice?: number;
    maxPrice?: number;
    roomType?: string;
    /** Stored spellings of a custom room type (see customRoomTypeSpellings). */
    roomTypeSpellings?: string[];
    inDirectory?: boolean;
    publicOnly: boolean;
  }): Prisma.AccommodationWhereInput {
    const {
      type,
      search,
      city,
      isPublic,
      minPrice,
      maxPrice,
      roomType,
      roomTypeSpellings,
      inDirectory,
      publicOnly,
    } = params;
    const where: Prisma.AccommodationWhereInput = {};

    if (publicOnly) {
      where.isPublic = true;
    } else if (isPublic !== undefined) {
      // Admin list can filter published vs hidden items
      where.isPublic = isPublic;
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
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

    // Under AND, so a custom name (also on localizations) keeps the search
    if (roomType) {
      where.AND = [listingRoomTypeWhere(roomType, roomTypeSpellings)];
    }

    // Admin list only: listings that fill a hotel-directory entry (or not)
    if (!publicOnly && inDirectory !== undefined) {
      where.hotel = inDirectory ? { isNot: null } : { is: null };
    }

    return where;
  }

  /** Whitelisted so an unknown sort field can't reach Prisma (500). */
  private buildOrderBy(
    sortBy: string,
    sortOrder: string,
  ): Prisma.AccommodationOrderByWithRelationInput {
    const { field, order } = resolveSort(
      sortBy,
      sortOrder as 'asc' | 'desc',
      ACCOMMODATION_SORT_FIELDS,
      'createdAt',
    );
    return { [field]: order };
  }

  /** Distinct cities and custom room types for the admin filter dropdowns. */
  async getFilterOptions(publicOnly = false) {
    const [rows, localizations] = await Promise.all([
      this.prisma.accommodation.findMany({
        where: publicOnly ? { isPublic: true } : {},
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      }),
      this.prisma.accommodationLocalization.findMany({
        where: {
          customRoomTypes: { isEmpty: false },
          ...(publicOnly && { accommodation: { isPublic: true } }),
        },
        // Oldest listing first, so the spelling shown for a name stays the
        // same (localization rows are recreated on every save)
        orderBy: [
          { accommodation: { createdAt: 'asc' } },
          { accommodationId: 'asc' },
          { locale: 'asc' },
        ],
        select: { customRoomTypes: true },
      }),
    ]);
    return {
      cities: rows.map((r) => r.city).filter((city) => !!city?.trim()),
      customRoomTypes: collectCustomRoomTypes(
        localizations.map((loc) => loc.customRoomTypes),
      ),
    };
  }

  /**
   * Every stored spelling of a custom room type ("Sea view", "sea view"…),
   * as the filter list shows them as one. Nothing to look up for a code.
   */
  private async findRoomTypeSpellings(roomType: string) {
    if (toRoomType(roomType)) return undefined;
    const localizations = await this.prisma.accommodationLocalization.findMany({
      where: { customRoomTypes: { isEmpty: false } },
      select: { customRoomTypes: true },
    });
    return customRoomTypeSpellings(
      roomType,
      localizations.map((loc) => loc.customRoomTypes),
    );
  }

  /**
   * Every listing, published or hidden, for the hotel directory's picker,
   * with the id of the directory entry already filled from it.
   */
  async getListingOptions(user: AuthUser) {
    const rows = await this.prisma.accommodation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        type: true,
        city: true,
        price: true,
        mainImage: true,
        isPublic: true,
        roomTypes: true,
        localizations: {
          select: {
            locale: true,
            name: true,
            address: true,
            customRoomTypes: true,
          },
        },
        hotel: { select: { id: true, createdById: true } },
      },
    });
    return rows.map(({ price, hotel, ...row }) => ({
      ...row,
      price: Number(price),
      // Taken by a directory entry; which one only for those who may open it
      linked: !!hotel,
      hotelId: this.directoryEntry(user, hotel)?.id ?? null,
    }));
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
