import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

// PrismaService, AccessService and CurrencyService come from global modules.
@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
