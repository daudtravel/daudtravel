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
      },
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
    });

    return videos;
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto) {
    // Check if video exists
    await this.findOne(id);

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
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
