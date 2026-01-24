// insurance.dto.ts
import {
  IsString,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InsurancePersonDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  passportPhoto: string; // Base64 encoded image

  @IsDateString()
  @IsNotEmpty()
  startDate: string; // ISO date string

  @IsDateString()
  @IsNotEmpty()
  endDate: string; // ISO date string
}

export class CreateInsuranceSubmissionDto {
  @IsEmail()
  @IsNotEmpty()
  submitterEmail: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsurancePersonDto)
  people: InsurancePersonDto[];
}

export class UpdateInsuranceSettingsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDay?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount30Days?: number; // Percentage (e.g., 10 for 10%)

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount90Days?: number; // Percentage (e.g., 20 for 20%)

  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
