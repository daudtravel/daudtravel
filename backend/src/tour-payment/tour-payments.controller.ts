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
import { TourPaymentsService } from './tour-payments.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Tour Payments')
@Controller('tours')
export class TourPaymentsController {
  constructor(private readonly tourPaymentsService: TourPaymentsService) {}

  @Post('payments/bog/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create BOG payment for tour booking' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  async createPayment(@Body() body: { bookingData: any }) {
    if (!body.bookingData) {
      throw new BadRequestException('Booking data is required');
    }

    return this.tourPaymentsService.createPayment(body.bookingData);
  }

  @Post('payments/bog/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle BOG payment callback' })
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

    return this.tourPaymentsService.handleBOGCallback(rawBody, signature);
  }

  @Get('payments/bog/status/:order_id')
  @ApiOperation({ summary: 'Get BOG payment receipt status' })
  @ApiResponse({ status: 200, description: 'Receipt status retrieved' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getReceiptStatus(@Param('order_id') orderId: string) {
    return this.tourPaymentsService.getReceiptStatus(orderId);
  }

  @Get('orders')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all tour payment orders (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tourPaymentsService.getOrders(page, limit);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get tour payment order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string) {
    return this.tourPaymentsService.getOrderById(id);
  }

  @Delete('orders/failed')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all failed payment orders (Admin)' })
  @ApiResponse({ status: 200, description: 'Failed orders deleted' })
  async deleteFailedOrders() {
    return this.tourPaymentsService.deleteFailedOrders();
  }
}
