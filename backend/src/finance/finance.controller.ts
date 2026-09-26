import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser, RequirePermission } from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { FinanceService } from './finance.service';
import { FinanceReportQueryDto } from './dto/finance.dto';

@ApiTags('Finance')
@ApiBearerAuth('JWT-auth')
@Controller('finance')
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('report')
  @RequirePermission(PermissionModule.FINANCE, 'view')
  @ApiOperation({ summary: 'Income, expenses and profit for a period' })
  report(@CurrentUser() user: AuthUser, @Query() query: FinanceReportQueryDto) {
    return this.financeService.report(user, query);
  }
}
