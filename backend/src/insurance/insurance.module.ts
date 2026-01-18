import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileUploadModule } from '@/common/modules/file-upload.module';
import { MailService } from '@/mail/mail.service';
 

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [InsuranceController],
  providers: [InsuranceService, MailService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
