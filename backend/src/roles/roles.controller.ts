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
import { AuthGuard } from '@/common/guards/auth.guard';
import { SuperAdminOnly } from '@/access/access.decorators';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(AuthGuard)
@SuperAdminOnly()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles with permissions and user counts' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'All roles (id + name) for pickers' })
  options() {
    return this.rolesService.options();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.rolesService.findOne(id) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRoleDto) {
    return {
      message: 'ROLE_CREATED',
      data: await this.rolesService.create(dto),
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return {
      message: 'ROLE_UPDATED',
      data: await this.rolesService.update(id, dto),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return { message: 'ROLE_DELETED', ...(await this.rolesService.remove(id)) };
  }
}
