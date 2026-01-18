import { Module } from '@nestjs/common';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileUploadService } from '../common/utils/file-upload.util';

@Module({
  imports: [PrismaModule],
  controllers: [ToursController],
  providers: [ToursService, FileUploadService],
  exports: [ToursService],
})
export class ToursModule {}
