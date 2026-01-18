import {
  Controller,
  Get,
  Post,
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
  BadRequestException,
} from '@nestjs/common';
import { TransferPaymentsService } from './transfer-payments.service';
import { AuthGuard } from '@/common/guards/auth.guard';
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
  async createPayment(@Body() body: { bookingData: any }) {
    if (!body.bookingData) {
      throw new BadRequestException('Booking data is required');
    }

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
  @ApiOperation({ summary: 'Get all transfer payment orders (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.transferPaymentsService.getOrders(page, limit, status);
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
