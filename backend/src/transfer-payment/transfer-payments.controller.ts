import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransferPaymentsService } from './transfer-payments.service';
import { CreateTransferPaymentDto } from './dto/create-transfer-payment.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { TransferOrdersQueryDto } from '@/common/dto/order-list-query.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from '@/access/access.decorators';
import { PermissionModule } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Transfer Payments')
@Controller('transfers')
export class TransferPaymentsController {
  constructor(
    private readonly transferPaymentsService: TransferPaymentsService,
  ) {}

  @Post('payments/bog/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create BOG payment for transfer booking' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  async createPayment(@Body() body: CreateTransferPaymentDto) {
    return this.transferPaymentsService.createPayment(body.bookingData);
  }

  @Post('payments/bog/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle BOG payment callback for transfers' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  async handleCallback(
    @Req() req: RawBodyRequest<Request>,
    @Headers('callback-signature') signature: string,
  ) {
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    return this.transferPaymentsService.handleBOGCallback(rawBody, signature);
  }

  @Get('payments/bog/status/:order_id')
  @ApiOperation({ summary: 'Get BOG payment receipt status for transfer' })
  @ApiResponse({ status: 200, description: 'Receipt status retrieved' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getReceiptStatus(@Param('order_id') orderId: string) {
    return this.transferPaymentsService.getReceiptStatus(orderId);
  }

  @Get('orders')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'view')
  @ApiOperation({
    summary: 'Get all transfer payment orders with filters (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(@Query() query: TransferOrdersQueryDto) {
    return this.transferPaymentsService.getOrders(query);
  }

  @Patch('orders/:id/driver')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'edit')
  @ApiOperation({ summary: 'Assign or change the driver of an order (Admin)' })
  @ApiResponse({ status: 200, description: 'Driver assigned' })
  @ApiResponse({ status: 404, description: 'Order or driver not found' })
  async assignDriver(
    @Param('id') id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.transferPaymentsService.assignDriver(id, dto.driverId ?? null);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get transfer payment order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string) {
    return this.transferPaymentsService.getOrderById(id);
  }

  @Delete('orders/failed')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete all failed transfer payment orders (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Failed orders deleted' })
  async deleteFailedOrders() {
    return this.transferPaymentsService.deleteFailedOrders();
  }

  @Delete('orders/expired')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete all expired transfer payment orders (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Expired orders deleted' })
  async deleteExpiredOrders() {
    return this.transferPaymentsService.deleteExpiredOrders();
  }

  @Delete('orders/cleanup')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup both failed and expired transfer payment orders (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Failed and expired orders deleted',
  })
  async cleanupOrders() {
    return this.transferPaymentsService.cleanupOrders();
  }
}
