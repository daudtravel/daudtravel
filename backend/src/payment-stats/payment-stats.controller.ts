import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PaymentStatsService } from './payment-stats.service';

@ApiTags('Payment Stats')
@Controller('payment-stats')
export class PaymentStatsController {
  constructor(private readonly service: PaymentStatsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary:
      'Aggregated payment statistics across tours, transfers, quick payments and insurance (Admin)',
  })
  async getStats() {
    return this.service.getStats();
  }
}
