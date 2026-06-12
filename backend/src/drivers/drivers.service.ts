import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FileUploadService } from '@/common/utils/file-upload.util';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(dto: CreateDriverDto, file?: Express.Multer.File) {
    let photo: string | undefined;

    if (file) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploaded = await this.fileUploadService.uploadBase64Image(base64, 'drivers');
      photo = uploaded.url;
    }

    return this.prisma.driver.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        photo,
      },
    });
  }

  async findAll() {
    const drivers = await this.prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { reviews: true } },
      },
    });

    return {
      count: drivers.length,
      drivers: drivers.map((d) => this.formatDriver(d)),
    };
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        reviews: { orderBy: { createdAt: 'desc' } },
        _count: { select: { reviews: true } },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.formatDriver(driver);
  }

  async update(id: string, dto: UpdateDriverDto, file?: Express.Multer.File) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    let photo: string | undefined;

    if (file) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploaded = await this.fileUploadService.uploadBase64Image(base64, 'drivers');
      photo = uploaded.url;

      if (driver.photo) {
        await this.fileUploadService.deleteFile(driver.photo);
      }
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.languages !== undefined && { languages: dto.languages }),
        ...(dto.dailyRentPrice !== undefined && { dailyRentPrice: dto.dailyRentPrice }),
        ...(photo && { photo }),
      },
      include: {
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { reviews: true } },
      },
    });

    return this.formatDriver(updated);
  }

  async addCarPhotos(id: string, files: Express.Multer.File[]) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No photos provided');
    }

    const urls: string[] = [];

    for (const file of files) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploaded = await this.fileUploadService.uploadBase64Image(base64, 'drivers/cars');
      urls.push(uploaded.url);
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { carPhotos: [...driver.carPhotos, ...urls] },
    });

    return updated.carPhotos;
  }

  async removeCarPhoto(id: string, url: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!driver.carPhotos.includes(url)) {
      throw new NotFoundException('Car photo not found');
    }

    await this.fileUploadService.deleteFile(url);

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { carPhotos: driver.carPhotos.filter((p) => p !== url) },
    });

    return updated.carPhotos;
  }

  async delete(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.photo) {
      await this.fileUploadService.deleteFile(driver.photo);
    }

    if (driver.carPhotos.length > 0) {
      await this.fileUploadService.deleteFiles(driver.carPhotos);
    }

    return this.prisma.driver.delete({ where: { id } });
  }

  async createReview(driverId: string, dto: CreateDriverReviewDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const review = await this.prisma.driverReview.create({
      data: {
        driverId,
        rating: dto.rating,
        comment: dto.comment,
        reviewerName: dto.reviewerName,
      },
    });

    return review;
  }

  async getReviews(driverId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const reviews = await this.prisma.driverReview.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return {
      driverId,
      averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      totalReviews: reviews.length,
      reviews,
    };
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.driverReview.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.driverReview.delete({ where: { id: reviewId } });
  }

  private formatDriver(driver: any) {
    const totalRating = driver.reviews?.reduce((sum: number, r: any) => sum + r.rating, 0) ?? 0;
    const reviewCount = driver._count?.reviews ?? 0;

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
      averageRating: reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : null,
      totalReviews: reviewCount,
      recentReviews: driver.reviews ?? [],
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
