// src/videos/videos.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { VideosService } from './videos.service';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('create_video')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new video (Admin only)' })
  @ApiResponse({ status: 201, description: 'Video created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createVideoDto: CreateVideoDto) {
    const video = await this.videosService.create(createVideoDto);

    return {
      message: 'Video created successfully',
      data: video,
    };
  }

  @Get('video')
  @ApiOperation({ summary: 'Get all videos' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Videos retrieved successfully' })
  async findAll(@Query('category') category?: string) {
    const videos = await this.videosService.findAll(category);

    return {
      message: 'Videos retrieved successfully',
      data: videos,
    };
  }

  @Get('video/:id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({ status: 200, description: 'Video retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async findOne(@Param('id') id: string) {
    const video = await this.videosService.findOne(id);

    return {
      message: 'Video retrieved successfully',
      data: video,
    };
  }

  @Put('update_video/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update video (Admin only)' })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    const video = await this.videosService.update(id, updateVideoDto);

    return {
      message: 'Video updated successfully',
      data: video,
    };
  }

  @Delete('delete_video/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete video (Admin only)' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    const result = await this.videosService.remove(id);

    return {
      message: 'Video deleted successfully',
      data: result,
    };
  }
}
