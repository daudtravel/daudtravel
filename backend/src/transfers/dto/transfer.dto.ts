import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  ValidateNested,
  Min,
  IsInt,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { VehicleType } from '@prisma/client';

export class TransferLocalizationDto {
  @IsString()
  @IsNotEmpty()
  locale: string;

  @IsString()
  @IsNotEmpty()
  startLocation: string;

  @IsString()
  @IsNotEmpty()
  endLocation: string;
}

export class VehicleTypeDto {
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxPersons: number;
}

export class CreateTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLocalizationDto)
  @IsOptional()
  localizations?: TransferLocalizationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleTypeDto)
  @IsNotEmpty()
  vehicleTypes: VehicleTypeDto[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPublic?: boolean = false;
}

export class UpdateTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLocalizationDto)
  @IsOptional()
  localizations?: TransferLocalizationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleTypeDto)
  @IsOptional()
  vehicleTypes?: VehicleTypeDto[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPublic?: boolean;
}
export class GetTransfersQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  publicOnly?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;
}

export class GetTransferByIdQueryDto {
  @IsOptional()
  @IsString()
  locale?: string;
}
