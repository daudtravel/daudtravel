import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { ToursModule } from './tours/tours.module';
import { MailModule } from './mail/mail.module';
import { GuardsModule } from './guards/guards.module';
import { AuthModule } from './auth/auth.module';
import { FileUploadModule } from './common/modules/file-upload.module';
import { TourPaymentsModule } from './tour-payment/tour-payments.module';
import { TransfersModule } from './transfers/transfer.module';
import { TransferPaymentsModule } from './transfer-payment/transfer-payment.module';
import { DriversModule } from './drivers/drivers.module';
import { FaqModule } from './faq/faq.module';
import { VideosModule } from './videos/videos.module';
import { QuickPaymentModule } from './quick-payment/quick-payment.module';
import { InsuranceModule } from './insurance/insurance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TourPaymentsModule,
    ToursModule,
    MailModule,
    GuardsModule,
    AuthModule,
    FileUploadModule,
    TransferPaymentsModule,
    TransfersModule,
    DriversModule,
    FaqModule,
    VideosModule,
    QuickPaymentModule,
    InsuranceModule,
  ],
})
export class AppModule {}
