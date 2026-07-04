import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PaymentStatsService, PaymentType } from './payment-stats.service';

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

  @Get('orders')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Unified paginated payment orders across all types (Admin)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['tours', 'transfers', 'quick', 'insurance'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getOrders(
    @Query('type') type?: PaymentType,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getOrders(type, status, page, limit);
  }
}
