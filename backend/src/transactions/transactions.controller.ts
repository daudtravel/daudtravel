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
import { CurrentUser, RequirePermission } from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  UpdateTransactionDto,
} from './dto/transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermission(PermissionModule.TRANSACTIONS, 'view')
  @ApiOperation({ summary: 'Income and expenses (filters + pagination)' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.findAll(user, query);
  }

  @Get('summary')
  @RequirePermission(PermissionModule.TRANSACTIONS, 'view')
  @ApiOperation({ summary: 'Totals for the same filters' })
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.summary(user, query);
  }

  @Get(':id')
  @RequirePermission(PermissionModule.TRANSACTIONS, 'view')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.transactionsService.findOne(user, id) };
  }

  @Post()
  @RequirePermission(PermissionModule.TRANSACTIONS, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return {
      message: 'TRANSACTION_CREATED',
      data: await this.transactionsService.create(user, dto),
    };
  }

  @Put(':id')
  @RequirePermission(PermissionModule.TRANSACTIONS, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return {
      message: 'TRANSACTION_UPDATED',
      data: await this.transactionsService.update(user, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionModule.TRANSACTIONS, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.transactionsService.remove(user, id);
    return { message: 'TRANSACTION_DELETED' };
  }
}
