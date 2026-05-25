import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
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

  async delete(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.photo) {
      await this.fileUploadService.deleteFile(driver.photo);
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
      averageRating: reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : null,
      totalReviews: reviewCount,
      recentReviews: driver.reviews ?? [],
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
