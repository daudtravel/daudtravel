import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';

// PrismaService comes from the global PrismaModule (re-providing it here would
// open a second database connection pool).
@Module({
  controllers: [DriversController],
  providers: [DriversService],
})
export class DriversModule {}
