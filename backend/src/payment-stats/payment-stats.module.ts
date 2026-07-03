import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentStatsController } from './payment-stats.controller';
import { PaymentStatsService } from './payment-stats.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentStatsController],
  providers: [PaymentStatsService],
})
export class PaymentStatsModule {}
