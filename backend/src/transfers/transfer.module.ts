import { Module } from '@nestjs/common';
import { TransfersController } from './transfer.controller';
import { TransferService } from './transfer.service';

@Module({
  controllers: [TransfersController],
  providers: [TransferService],
})
export class TransfersModule {}
