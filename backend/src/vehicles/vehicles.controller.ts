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
import { VehiclesService } from './vehicles.service';
import {
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from './dto/vehicles.dto';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller('vehicles')
@UseGuards(AuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  @ApiOperation({ summary: 'List vehicles (filters + pagination)' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListVehiclesQueryDto) {
    return this.vehiclesService.findAll(user, query);
  }

  @Get('options')
  @RequireAnyPermission(...LOOKUP_CONSUMERS)
  @ApiOperation({ summary: 'Active vehicles for pickers' })
  options(@CurrentUser() user: AuthUser, @Query('driverId') driverId?: string) {
    return this.vehiclesService.options(user, driverId);
  }

  @Get('filter-options')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  @ApiOperation({ summary: 'Distinct brands for the filter bar' })
  filterOptions(@CurrentUser() user: AuthUser) {
    return this.vehiclesService.filterOptions(user);
  }

  @Get(':id')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.vehiclesService.findOne(user, id) };
  }

  @Post()
  @RequirePermission(PermissionModule.DRIVERS, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return {
      message: 'VEHICLE_CREATED',
      data: await this.vehiclesService.create(user, dto),
    };
  }

  @Put(':id')
  @RequirePermission(PermissionModule.DRIVERS, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return {
      message: 'VEHICLE_UPDATED',
      data: await this.vehiclesService.update(user, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionModule.DRIVERS, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.vehiclesService.remove(user, id);
    return { message: 'VEHICLE_DELETED' };
  }
}
