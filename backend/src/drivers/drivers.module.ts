import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { PrismaService } from '../prisma/prisma.service'; // if not global

@Module({
  controllers: [DriversController],
  providers: [DriversService, PrismaService], // remove PrismaService if it's global
  // exports: [DriversService],                 // if needed in other modules
})
export class DriversModule {}
