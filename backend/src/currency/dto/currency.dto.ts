import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Currency, RateSource } from '@prisma/client';
import {
  DATE_ONLY_REGEX,
  DateRangeQueryDto,
} from '@/common/dto/pagination.dto';
import { trimToUndefined } from '@/common/dto/transforms';

export class ListRatesQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: RateSource })
  @IsOptional()
  @IsEnum(RateSource)
  source?: RateSource;
}

export class SetRateDto {
  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ example: '2026-09-20' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'GEL per 1 unit', example: 2.61 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.00000001)
  @Max(1000000)
  rate: number;
}

export class ConvertQueryDto {
  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  from: Currency;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  to: Currency;

  @ApiPropertyOptional({ example: '2026-09-20' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  date?: string;
}
