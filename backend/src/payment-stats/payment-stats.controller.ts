import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from '@/access/access.decorators';
import { PermissionModule } from '@prisma/client';
import { PaymentStatsService, PaymentType } from './payment-stats.service';

@ApiTags('Payment Stats')
@Controller('payment-stats')
export class PaymentStatsController {
  constructor(private readonly service: PaymentStatsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'view')
  @ApiOperation({
    summary:
      'Aggregated payment statistics across tours, transfers, quick payments and insurance (Admin)',
  })
  async getStats() {
    return this.service.getStats();
  }

  @Get('orders')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'view')
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
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-12-31' })
  async getOrders(
    @Query('type') type?: PaymentType,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getOrders(type, status, page, limit, {
      search,
      dateFrom,
      dateTo,
    });
  }
}
