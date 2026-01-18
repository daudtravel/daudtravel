import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { TourPaymentsController } from './tour-payments.controller';
import { TourPaymentsService } from './tour-payments.service';
 

@Module({
  imports: [MailModule],
  controllers: [TourPaymentsController],
  providers: [TourPaymentsService, PrismaService],
})
export class TourPaymentsModule {}
