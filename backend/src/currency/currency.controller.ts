import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  AuthenticatedOnly,
  RequirePermission,
} from '@/access/access.decorators';
import { parseOptionalDateOnly } from '@/common/utils/date-only.util';
import { CurrencyService } from './currency.service';
import {
  ConvertQueryDto,
  ListRatesQueryDto,
  SetRateDto,
} from './dto/currency.dto';
import { SUPPORTED_CURRENCIES } from './currency.constants';

@ApiTags('Currency')
@ApiBearerAuth('JWT-auth')
@Controller('currency')
@UseGuards(AuthGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates/latest')
  @AuthenticatedOnly()
  @ApiOperation({ summary: 'Latest rate per currency (GEL per unit)' })
  async latest() {
    return {
      data: await this.currencyService.getLatestRates(),
      currencies: SUPPORTED_CURRENCIES,
    };
  }

  @Get('rates')
  @RequirePermission(PermissionModule.CURRENCY, 'view')
  @ApiOperation({ summary: 'Exchange rate history (filters + pagination)' })
  list(@Query() query: ListRatesQueryDto) {
    return this.currencyService.listRates(query);
  }

  @Post('rates/refresh')
  @RequirePermission(PermissionModule.CURRENCY, 'edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch today’s rates from the providers now' })
  async refresh() {
    const result = await this.currencyService.refreshRates();
    return { message: 'RATES_REFRESHED', ...result };
  }

  @Put('rates')
  @RequirePermission(PermissionModule.CURRENCY, 'edit')
  @ApiOperation({ summary: 'Set a rate manually for one currency and day' })
  async setRate(@Body() dto: SetRateDto) {
    return {
      message: 'RATE_SAVED',
      data: await this.currencyService.setManualRate(dto),
    };
  }

  @Get('convert')
  @AuthenticatedOnly()
  @ApiOperation({ summary: 'Convert an amount between two currencies' })
  async convert(@Query() query: ConvertQueryDto) {
    const date = parseOptionalDateOnly(query.date, 'date');
    const result = await this.currencyService.convert(
      query.amount,
      query.from,
      query.to,
      date ?? undefined,
    );
    return {
      data: {
        amount: query.amount,
        from: query.from,
        to: query.to,
        result: Number(result.toFixed(2)),
      },
    };
  }
}
