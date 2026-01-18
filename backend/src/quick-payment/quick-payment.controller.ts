import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuickPaymentService } from './quick-payment.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  CreateQuickLinkDto,
  UpdateQuickLinkDto,
  InitiatePaymentDto,
} from './dto/quick-payment.dto';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Quick Payment')
@Controller('quick-payment')
export class QuickPaymentController {
  constructor(private readonly service: QuickPaymentService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get('public/links')
  @ApiOperation({ summary: 'Get public payment links for website (No Auth)' })
  async getPublicLinks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getPublicLinks(page, limit);
  }

  @Get('links/:slug')
  @ApiOperation({ summary: 'Get payment link details (Public)' })
  async getLink(@Param('slug') slug: string) {
    return this.service.getQuickLink(slug);
  }

  @Post('links/:slug/pay')
  @ApiOperation({ summary: 'Initiate payment for a link (Public)' })
  async initiatePayment(
    @Param('slug') slug: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.service.initiatePayment(slug, dto);
  }

  @Post('bog/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOG payment callback' })
  async handleCallback(
    @Req() req: any,
    @Headers('callback-signature') signature: string,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    return this.service.handleBOGCallback(rawBody, signature);
  }

  @Get('status/:externalOrderId')
  @ApiOperation({ summary: 'Get payment status by external order ID (Public)' })
  async getPaymentStatus(@Param('externalOrderId') externalOrderId: string) {
    return this.service.getPaymentStatus(externalOrderId);
  }

  // ============ ADMIN ENDPOINTS (LINKS MANAGEMENT) ============

  @Post('links')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create payment link (Admin)' })
  async createLink(@Body() dto: CreateQuickLinkDto) {
    return this.service.createQuickLink(dto);
  }

  @Get('links')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all payment links (Admin)' })
  async getAllLinks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAllLinks(page, limit);
  }

  @Put('links/:slug')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update payment link (Admin)' })
  async updateLink(
    @Param('slug') slug: string,
    @Body() dto: UpdateQuickLinkDto,
  ) {
    return this.service.updateLink(slug, dto);
  }

  @Post('links/:slug/toggle')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Toggle link active status (Admin)' })
  async toggleLink(@Param('slug') slug: string) {
    return this.service.toggleLinkStatus(slug);
  }

  @Delete('links/:slug')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete payment link (Admin)' })
  async deleteLink(@Param('slug') slug: string) {
    return this.service.deleteLink(slug);
  }

  // ============ ADMIN ENDPOINTS (ORDERS MANAGEMENT) ============

  @Get('orders')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all payment orders (Admin)' })
  @ApiQuery({ name: 'linkId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllOrders(
    @Query('linkId') linkId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAllOrders(linkId, status, page, limit);
  }

  @Get('orders/:orderId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get order details by ID (Admin)' })
  async getOrderById(@Param('orderId') orderId: string) {
    return this.service.getOrderById(orderId);
  }
}
