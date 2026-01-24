import { Module } from '@nestjs/common';
import { QuickPaymentController } from './quick-payment.controller';
import { QuickPaymentService } from './quick-payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileUploadModule } from '@/common/modules/file-upload.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [PrismaModule, FileUploadModule, MailModule],
  controllers: [QuickPaymentController],
  providers: [QuickPaymentService],
  exports: [QuickPaymentService],
})
export class QuickPaymentModule {}
