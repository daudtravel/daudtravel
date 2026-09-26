import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';

// PrismaService and AccessService come from their global modules.
@Module({
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
