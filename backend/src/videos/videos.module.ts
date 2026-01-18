// src/videos/videos.module.ts
import { Module } from '@nestjs/common';

import { VideosController } from './videos.controller';
import { PrismaService } from '../prisma/prisma.service';
import { VideosService } from './videos.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService, PrismaService],
  exports: [VideosService],
})
export class VideosModule {}
