import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser, RequireAnyPermission } from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { BOOKING_MODULES, BookingsService } from './bookings.service';
import {
  ChangeBookingStatusDto,
  CommissionPaidDto,
  CreateBookingDto,
  DraftFromOrderQueryDto,
  ListBookingsQueryDto,
  SupplierPaidDto,
  UpdateBookingDto,
} from './dto/bookings.dto';

const CAN_VIEW = BOOKING_MODULES.map((module) => ({
  module,
  action: 'view' as const,
}));
const CAN_CREATE = BOOKING_MODULES.map((module) => ({
  module,
  action: 'create' as const,
}));
const CAN_EDIT = BOOKING_MODULES.map((module) => ({
  module,
  action: 'edit' as const,
}));
const CAN_DELETE = BOOKING_MODULES.map((module) => ({
  module,
  action: 'delete' as const,
}));

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @RequireAnyPermission(...CAN_VIEW)
  @ApiOperation({ summary: 'Bookings (filters + pagination)' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.findAll(user, query);
  }

  @Get('summary')
  @RequireAnyPermission(...CAN_VIEW)
  @ApiOperation({ summary: 'Totals for the same filters, per currency' })
  summary(@CurrentUser() user: AuthUser, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.summary(user, query);
  }

  @Get('linked-orders')
  @RequireAnyPermission(...CAN_VIEW)
  @ApiOperation({ summary: 'Website orders that already have a booking' })
  linkedOrders(@CurrentUser() user: AuthUser) {
    return this.bookingsService.linkedOrders(user);
  }

  @Get('draft-from-order')
  @RequireAnyPermission(...CAN_CREATE)
  @ApiOperation({ summary: 'Booking draft built from a paid website order' })
  draftFromOrder(
    @CurrentUser() user: AuthUser,
    @Query() query: DraftFromOrderQueryDto,
  ) {
    return this.bookingsService.draftFromOrder(user, query);
  }

  @Get(':id')
  @RequireAnyPermission(...CAN_VIEW)
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.bookingsService.findOne(user, id) };
  }

  @Post()
  @RequireAnyPermission(...CAN_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return {
      message: 'BOOKING_CREATED',
      data: await this.bookingsService.create(user, dto),
    };
  }

  @Put(':id')
  @RequireAnyPermission(...CAN_EDIT)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return {
      message: 'BOOKING_UPDATED',
      data: await this.bookingsService.update(user, id, dto),
    };
  }

  @Patch(':id/status')
  @RequireAnyPermission(...CAN_EDIT)
  async changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ChangeBookingStatusDto,
  ) {
    return {
      message: 'BOOKING_UPDATED',
      data: await this.bookingsService.changeStatus(user, id, dto.status),
    };
  }

  @Patch('items/:itemId/supplier-paid')
  @RequireAnyPermission(...CAN_EDIT)
  async setSupplierPaid(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: SupplierPaidDto,
  ) {
    return {
      message: 'BOOKING_UPDATED',
      data: await this.bookingsService.setSupplierPaid(
        user,
        itemId,
        dto.supplierPaid,
      ),
    };
  }

  @Patch('commissions/:commissionId/paid')
  @RequireAnyPermission(...CAN_EDIT)
  async setCommissionPaid(
    @CurrentUser() user: AuthUser,
    @Param('commissionId') commissionId: string,
    @Body() dto: CommissionPaidDto,
  ) {
    return {
      message: 'BOOKING_UPDATED',
      data: await this.bookingsService.setCommissionPaid(
        user,
        commissionId,
        dto.paid,
      ),
    };
  }

  @Delete(':id')
  @RequireAnyPermission(...CAN_DELETE)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.bookingsService.remove(user, id);
    return { message: 'BOOKING_DELETED' };
  }
}
