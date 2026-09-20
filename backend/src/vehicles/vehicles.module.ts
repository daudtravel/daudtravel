import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';

// PrismaService and AccessService come from their global modules.
@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
