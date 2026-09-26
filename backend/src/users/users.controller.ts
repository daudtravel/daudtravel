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
import {
  CurrentUser,
  LOOKUP_CONSUMERS,
  RequireAnyPermission,
  SuperAdminOnly,
} from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  ListUsersQueryDto,
  SetUserPasswordDto,
  UpdateUserDto,
} from './dto/users.dto';

@ApiTags('Users (staff)')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @SuperAdminOnly()
  @ApiOperation({ summary: 'List staff users (filters + pagination)' })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('lookup')
  @RequireAnyPermission(...LOOKUP_CONSUMERS)
  @ApiOperation({ summary: 'Minimal user list for owner/employee pickers' })
  lookup(@Query('includeInactive') includeInactive?: string) {
    return this.usersService.lookup(includeInactive === 'true');
  }

  @Get(':id')
  @SuperAdminOnly()
  async findOne(@Param('id') id: string) {
    return { data: await this.usersService.findOne(id) };
  }

  @Post()
  @SuperAdminOnly()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return {
      message: 'USER_CREATED',
      data: await this.usersService.create(dto),
    };
  }

  @Put(':id')
  @SuperAdminOnly()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return {
      message: 'USER_UPDATED',
      data: await this.usersService.update(id, dto, actor),
    };
  }

  @Put(':id/password')
  @SuperAdminOnly()
  @ApiOperation({ summary: "Set another user's password (signs them out)" })
  async setPassword(
    @Param('id') id: string,
    @Body() dto: SetUserPasswordDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.usersService.setPassword(id, dto, actor);
    return { message: 'PASSWORD_CHANGED' };
  }

  @Delete(':id')
  @SuperAdminOnly()
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    await this.usersService.remove(id, actor);
    return { message: 'USER_DELETED' };
  }
}
