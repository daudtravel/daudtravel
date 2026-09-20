import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  CurrentUser,
  LOOKUP_CONSUMERS,
  RequireAnyPermission,
  RequirePermission,
} from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { HotelsService } from './hotels.service';
import {
  CreateHotelDto,
  ListHotelsQueryDto,
  UpdateHotelDto,
} from './dto/hotels.dto';

@ApiTags('Hotels')
@ApiBearerAuth('JWT-auth')
@Controller('hotels')
@UseGuards(AuthGuard)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  @RequirePermission(PermissionModule.HOTELS, 'view')
  @ApiOperation({ summary: 'Hotel directory (filters + pagination)' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListHotelsQueryDto) {
    return this.hotelsService.findAll(user, query);
  }

  @Get('options')
  @RequireAnyPermission(...LOOKUP_CONSUMERS)
  @ApiOperation({ summary: 'Active hotels for pickers' })
  options(@CurrentUser() user: AuthUser) {
    return this.hotelsService.options(user);
  }

  @Get('filter-options')
  @RequirePermission(PermissionModule.HOTELS, 'view')
  @ApiOperation({ summary: 'Distinct cities and regions for the filter bar' })
  filterOptions(@CurrentUser() user: AuthUser) {
    return this.hotelsService.filterOptions(user);
  }

  @Get(':id')
  @RequirePermission(PermissionModule.HOTELS, 'view')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.hotelsService.findOne(user, id) };
  }

  @Post()
  @RequirePermission(PermissionModule.HOTELS, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateHotelDto) {
    return {
      message: 'HOTEL_CREATED',
      data: await this.hotelsService.create(user, dto),
    };
  }

  @Put(':id')
  @RequirePermission(PermissionModule.HOTELS, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
  ) {
    return {
      message: 'HOTEL_UPDATED',
      data: await this.hotelsService.update(user, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionModule.HOTELS, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.hotelsService.remove(user, id);
    return { message: 'HOTEL_DELETED' };
  }
}
