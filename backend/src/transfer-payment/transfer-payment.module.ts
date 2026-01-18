import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { TransferPaymentsController } from './transfer-payments.controller';
import { TransferPaymentsService } from './transfer-payments.service';

@Module({
  imports: [MailModule],
  controllers: [TransferPaymentsController],
  providers: [TransferPaymentsService, PrismaService],
  exports: [TransferPaymentsService],
})
export class TransferPaymentsModule {}
