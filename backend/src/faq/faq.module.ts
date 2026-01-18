// src/faq/faq.module.ts
import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FaqController],
  providers: [FaqService, PrismaService],
  exports: [FaqService],
})
export class FaqModule {}
