import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class TransferBookingDataDto {
  @ApiProperty()
  @IsString()
  transferId: string;

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
  passengerCount: number;

  @ApiProperty()
  @IsDateString()
  transferDate: string;

  @ApiProperty()
  @IsDateString()
  transferTime: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverId?: string;
}

export class CreateTransferPaymentDto {
  @ApiProperty({ type: TransferBookingDataDto })
  bookingData: TransferBookingDataDto;
}
