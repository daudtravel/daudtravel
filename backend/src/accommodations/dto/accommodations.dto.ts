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
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum AccommodationType {
  HOTEL = 'HOTEL',
  APARTMENT = 'APARTMENT',
}

// Allowed amenity keys (frontend renders icons/labels per locale)
export const AMENITY_KEYS = [
  'wifi',
  'parking',
  'pool',
  'breakfast',
  'ac',
  'kitchen',
  'tv',
  'washingMachine',
  'heating',
  'balcony',
  'seaView',
  'elevator',
  'petsAllowed',
  'gym',
] as const;

// Localization DTO
export class AccommodationLocalizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  locale: string = 'ka';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string = '';
}

// Main Create DTO
export class CreateAccommodationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccommodationLocalizationDto)
  localizations: AccommodationLocalizationDto[];

  @IsEnum(AccommodationType)
  type: AccommodationType = AccommodationType.HOTEL;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  city: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxGuests: number = 1;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bedrooms: number = 1;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bathrooms: number = 1;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[] = [];

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
}

// Update DTO
export class UpdateAccommodationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccommodationLocalizationDto)
  @IsOptional()
  localizations?: AccommodationLocalizationDto[];

  @IsEnum(AccommodationType)
  @IsOptional()
  type?: AccommodationType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  city?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  maxGuests?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  bedrooms?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  bathrooms?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

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
}

// Query DTO
export class GetAccommodationsQueryDto {
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
  @IsEnum(AccommodationType)
  type?: AccommodationType;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  city?: string;

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
