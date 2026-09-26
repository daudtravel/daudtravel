import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { BookingType, Currency } from '@prisma/client';
import { DATE_ONLY_REGEX } from '@/common/dto/pagination.dto';
import { trimToUndefined } from '@/common/dto/transforms';

export class FinanceReportQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'dateFrom must be YYYY-MM-DD' })
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'dateTo must be YYYY-MM-DD' })
  dateTo?: string;

  @ApiPropertyOptional({
    enum: Currency,
    description: 'Currency the report is shown in (default GEL)',
  })
  @IsOptional()
  @IsEnum(Currency)
  displayCurrency?: Currency;

  @ApiPropertyOptional({ enum: BookingType })
  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  hotelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  tourId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Owner (who created the records)' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  createdById?: string;
}
