import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

// PrismaService and AccessService come from their global modules.
@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
