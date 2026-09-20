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
import { CatalogService } from './catalog.service';
import {
  CreateCatalogItemDto,
  ListCatalogQueryDto,
  UpdateCatalogItemDto,
} from './dto/catalog.dto';

@ApiTags('Catalog')
@ApiBearerAuth('JWT-auth')
@Controller('catalog')
@UseGuards(AuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @RequirePermission(PermissionModule.CATALOG, 'view')
  @ApiOperation({ summary: 'Price list (filters + pagination)' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListCatalogQueryDto) {
    return this.catalogService.findAll(user, query, query.displayCurrency);
  }

  @Get('options')
  @RequireAnyPermission(...LOOKUP_CONSUMERS)
  @ApiOperation({ summary: 'Active prices for pickers' })
  options(@CurrentUser() user: AuthUser) {
    return this.catalogService.options(user);
  }

  @Get('filter-options')
  @RequirePermission(PermissionModule.CATALOG, 'view')
  @ApiOperation({ summary: 'Distinct cities for the filter bar' })
  filterOptions(@CurrentUser() user: AuthUser) {
    return this.catalogService.filterOptions(user);
  }

  @Get(':id')
  @RequirePermission(PermissionModule.CATALOG, 'view')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.catalogService.findOne(user, id) };
  }

  @Post()
  @RequirePermission(PermissionModule.CATALOG, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCatalogItemDto,
  ) {
    return {
      message: 'CATALOG_ITEM_CREATED',
      data: await this.catalogService.create(user, dto),
    };
  }

  @Put(':id')
  @RequirePermission(PermissionModule.CATALOG, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return {
      message: 'CATALOG_ITEM_UPDATED',
      data: await this.catalogService.update(user, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionModule.CATALOG, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.catalogService.remove(user, id);
    return { message: 'CATALOG_ITEM_DELETED' };
  }
}
