import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVideoDto: CreateVideoDto) {
    const video = await this.prisma.video.create({
      data: {
        url: createVideoDto.url,
        title: createVideoDto.title,
        description: createVideoDto.description,
        category: createVideoDto.category,
        ...(createVideoDto.localizations?.length && {
          localizations: {
            create: createVideoDto.localizations.map((loc) => ({
              locale: loc.locale,
              title: loc.title,
              description: loc.description,
            })),
          },
        }),
      },
      include: { localizations: true },
    });

    return video;
  }

  async findAll(category?: string) {
    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    const videos = await this.prisma.video.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: { localizations: true },
    });

    return videos;
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { localizations: true },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto) {
    // Check if video exists
    await this.findOne(id);

    const { localizations, ...fields } = updateVideoDto;

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: {
        ...fields,
        ...(localizations !== undefined && {
          localizations: {
            deleteMany: {},
            create: localizations.map((loc) => ({
              locale: loc.locale,
              title: loc.title,
              description: loc.description,
            })),
          },
        }),
      },
      include: { localizations: true },
    });

    return updatedVideo;
  }

  async remove(id: string) {
    // Check if video exists
    await this.findOne(id);

    await this.prisma.video.delete({
      where: { id },
    });

    return {
      id,
      message: 'Video deleted successfully',
    };
  }
}
