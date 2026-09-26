import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TourPaymentsController } from './tour-payments.controller';
import { TourPaymentsService } from './tour-payments.service';
 

@Module({
  imports: [MailModule],
  controllers: [TourPaymentsController],
  providers: [TourPaymentsService],
})
export class TourPaymentsModule {}
