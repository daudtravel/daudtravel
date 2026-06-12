import { Module } from '@nestjs/common';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileUploadService } from '../common/utils/file-upload.util';

@Module({
  imports: [PrismaModule],
  controllers: [AccommodationsController],
  providers: [AccommodationsService, FileUploadService],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
