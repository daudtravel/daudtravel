import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
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
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
        'base64',
      )}`;

      const uploaded = await this.fileUploadService.uploadBase64Image(
        base64,
        'drivers',
      );

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
    });

    return {
      count: drivers.length,
      drivers,
    };
  }

  async delete(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (driver?.photo) {
      await this.fileUploadService.deleteFile(driver.photo);
    }

    return this.prisma.driver.delete({
      where: { id },
    });
  }
}
