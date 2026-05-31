import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TourBookingDataDto {
  @ApiProperty()
  @IsString()
  tourId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(50)
  peopleAmount: number;

  @ApiProperty()
  @IsDateString()
  selectedDate: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  tourDurationDays?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  tourDurationNights?: number;

  @ApiProperty()
  @IsBoolean()
  paymentType: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalTourPrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  remainingAmount?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  tourName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tourDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startLocation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endLocation?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locations?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locale?: string;
}

export class CreateTourPaymentDto {
  @ApiProperty({ type: TourBookingDataDto })
  bookingData: TourBookingDataDto;
}
