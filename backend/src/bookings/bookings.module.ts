import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

// PrismaService, AccessService and CurrencyService come from global modules.
@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
