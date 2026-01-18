import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsDateString,
  Min,
  IsInt,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum TourType {
  GROUP = 'GROUP',
  INDIVIDUAL = 'INDIVIDUAL',
}

// Localization DTO
export class TourLocalizationDto {
  @IsString()
  @IsNotEmpty()
  locale: string = 'ka';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  startLocation: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locations?: string[] = [];
}

// Pricing DTOs
export class GroupPricingDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reservationPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discountedPrice?: number;
}

export class IndividualPricingDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  seasonTotalPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  seasonReservationPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  seasonDiscountedPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offSeasonTotalPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offSeasonReservationPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offSeasonDiscountedPrice: number;
}

// Main Create Tour DTO
export class CreateTourDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourLocalizationDto)
  localizations: TourLocalizationDto[];

  @IsEnum(TourType)
  type: TourType = TourType.GROUP;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  days: number = 1;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  nights: number = 0;

  @IsString()
  @IsNotEmpty()
  mainImage: string; // base64

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gallery?: string[] = []; // base64 array

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPublic?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isDaily?: boolean = false;

  // Group pricing (required if type is GROUP)
  @ValidateNested()
  @Type(() => GroupPricingDto)
  @IsOptional()
  groupPricing?: GroupPricingDto;

  // Individual pricing (required if type is INDIVIDUAL)
  @ValidateNested()
  @Type(() => IndividualPricingDto)
  @IsOptional()
  individualPricing?: IndividualPricingDto;

  // For group tours
  @IsDateString()
  @IsOptional()
  startDate?: string;

  // For individual tours
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  maxPersons?: number;
}

// Update Tour DTO
export class UpdateTourDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourLocalizationDto)
  @IsOptional()
  localizations?: TourLocalizationDto[];

  @IsEnum(TourType)
  @IsOptional()
  type?: TourType;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  days?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  nights?: number;

  @IsString()
  @IsOptional()
  mainImage?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gallery?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isDaily?: boolean;

  @ValidateNested()
  @Type(() => GroupPricingDto)
  @IsOptional()
  groupPricing?: GroupPricingDto;

  @ValidateNested()
  @Type(() => IndividualPricingDto)
  @IsOptional()
  individualPricing?: IndividualPricingDto;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  maxPersons?: number;
}

// Query DTO
export class GetToursQueryDto {
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
  @IsEnum(TourType)
  type?: TourType;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  startLocation?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
