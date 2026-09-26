import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VehicleType } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import {
  toNullableNumber,
  toOptionalBoolean,
  toStringArrayAllowEmpty,
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';

export const DRIVER_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'dailyRentPrice',
] as const;

export class ListDriversQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Spoken language (exact value)' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(50)
  language?: string;

  @ApiPropertyOptional({ enum: VehicleType, description: 'Drives such a car' })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  showOnWebsite?: boolean;

  @ApiPropertyOptional({ description: 'Has at least one vehicle' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasVehicle?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  referrerId?: string;

  @ApiPropertyOptional({ description: 'Owner (who created the record)' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Daily rent price from' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100000)
  minRent?: number;

  @ApiPropertyOptional({ description: 'Daily rent price to' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100000)
  maxRent?: number;
}

/**
 * Driver create/update arrive as multipart/form-data (the profile photo rides
 * along), so every field is a string here — hence the transforms.
 */
export class CreateDriverDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toStringArrayAllowEmpty)
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  languages?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  dailyRentPrice?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Public website visibility; needs website edit permission',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  showOnWebsite?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Partner who brought us this driver',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  referrerId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Percent (0–100)' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  referrerCommissionRate?: number | null;

  @ApiPropertyOptional({
    description: 'Owner; only users with access to all records may set it',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  createdById?: string | null;
}

export class UpdateDriverDto extends CreateDriverDto {
  @ApiPropertyOptional({ description: 'Delete the current profile photo' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  removePhoto?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare lastName: string;
}

export class RemoveCarPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}

export class DriverMonthlyQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

/** Kept for the public review form. */
export class ListDriverOptionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search?: string;
}
