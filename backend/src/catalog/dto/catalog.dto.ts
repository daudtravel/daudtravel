import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CatalogCategory,
  CatalogSeason,
  CatalogUnit,
  Currency,
  VehicleType,
} from '@prisma/client';
import {
  DATE_ONLY_REGEX,
  PaginationQueryDto,
} from '@/common/dto/pagination.dto';
import {
  toNullableNumber,
  toOptionalBoolean,
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';

export const CATALOG_SORT_FIELDS = [
  'sortOrder',
  'name',
  'price',
  'category',
  'createdAt',
] as const;

export class ListCatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CatalogCategory })
  @IsOptional()
  @IsEnum(CatalogCategory)
  category?: CatalogCategory;

  @ApiPropertyOptional({ enum: CatalogUnit })
  @IsOptional()
  @IsEnum(CatalogUnit)
  unit?: CatalogUnit;

  @ApiPropertyOptional({ enum: CatalogSeason })
  @IsOptional()
  @IsEnum(CatalogSeason)
  season?: CatalogSeason;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Owner (who created the record)' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  createdById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: Currency,
    description: 'Show every price converted to this currency',
  })
  @IsOptional()
  @IsEnum(Currency)
  displayCurrency?: Currency;

  @ApiPropertyOptional({
    example: '2026-07-15',
    description: 'Only prices valid on this day',
  })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'validOn must be YYYY-MM-DD' })
  validOn?: string;
}

export class CreateCatalogItemDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ enum: CatalogCategory })
  @IsOptional()
  @IsEnum(CatalogCategory)
  category?: CatalogCategory;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: CatalogUnit })
  @IsOptional()
  @IsEnum(CatalogUnit)
  unit?: CatalogUnit;

  @ApiProperty()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  price: number;

  @ApiPropertyOptional({ nullable: true, description: 'What it costs us' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  cost?: number | null;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: VehicleType, nullable: true })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiPropertyOptional({ enum: CatalogSeason })
  @IsOptional()
  @IsEnum(CatalogSeason)
  season?: CatalogSeason;

  @ApiPropertyOptional({ nullable: true, example: '2026-06-01' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'validFrom must be YYYY-MM-DD' })
  validFrom?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'validTo must be YYYY-MM-DD' })
  validTo?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Owner; only users with access to all records may set it',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  createdById?: string | null;
}

export class UpdateCatalogItemDto extends CreateCatalogItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  declare price: number;
}
