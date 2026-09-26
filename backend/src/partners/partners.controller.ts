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
  RequireAnyPermission,
  RequirePermission,
  LOOKUP_CONSUMERS,
} from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { PartnersService } from './partners.service';
import {
  CreatePartnerDto,
  ListPartnersQueryDto,
  UpdatePartnerDto,
} from './dto/partners.dto';

@ApiTags('Partners')
@ApiBearerAuth('JWT-auth')
@Controller('partners')
@UseGuards(AuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @RequirePermission(PermissionModule.PARTNERS, 'view')
  @ApiOperation({ summary: 'List partners (filters + pagination)' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPartnersQueryDto) {
    return this.partnersService.findAll(user, query);
  }

  @Get('options')
  @RequireAnyPermission(...LOOKUP_CONSUMERS)
  @ApiOperation({ summary: 'Active partners for pickers' })
  options(@CurrentUser() user: AuthUser) {
    return this.partnersService.options(user);
  }

  @Get(':id')
  @RequirePermission(PermissionModule.PARTNERS, 'view')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.partnersService.findOne(user, id) };
  }

  @Post()
  @RequirePermission(PermissionModule.PARTNERS, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePartnerDto) {
    return {
      message: 'PARTNER_CREATED',
      data: await this.partnersService.create(user, dto),
    };
  }

  @Put(':id')
  @RequirePermission(PermissionModule.PARTNERS, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDto,
  ) {
    return {
      message: 'PARTNER_UPDATED',
      data: await this.partnersService.update(user, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionModule.PARTNERS, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.partnersService.remove(user, id);
    return { message: 'PARTNER_DELETED' };
  }
}
