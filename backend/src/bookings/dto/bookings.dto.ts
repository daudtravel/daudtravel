import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BookingItemType,
  BookingStatus,
  BookingType,
  CommissionKind,
  Currency,
} from '@prisma/client';
import {
  DATE_ONLY_REGEX,
  DateRangeQueryDto,
} from '@/common/dto/pagination.dto';
import {
  toNullableNumber,
  toOptionalBoolean,
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';

export const BOOKING_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'startDate',
  'number',
  'totalPrice',
  'touristName',
] as const;

export const PAYMENT_STATES = ['unpaid', 'partial', 'paid'] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const BOOKING_SOURCES = ['manual', 'website'] as const;

export class ListBookingsQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: BookingType })
  @IsOptional()
  @IsEnum(BookingType)
  type?: BookingType;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: PAYMENT_STATES })
  @IsOptional()
  @IsIn(PAYMENT_STATES)
  paymentState?: PaymentState;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Booking has a line at this hotel' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  hotelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  tourId?: string;

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

  @ApiPropertyOptional({ enum: BOOKING_SOURCES })
  @IsOptional()
  @IsIn(BOOKING_SOURCES)
  source?: (typeof BOOKING_SOURCES)[number];

  @ApiPropertyOptional({ description: 'Only bookings with money still due' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasBalance?: boolean;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Created from' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'createdFrom must be YYYY-MM-DD' })
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Created to' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'createdTo must be YYYY-MM-DD' })
  createdTo?: string;
}

export class BookingItemDto {
  @ApiPropertyOptional({ description: 'Existing line to update' })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  id?: string | null;

  @ApiProperty({ enum: BookingItemType })
  @IsEnum(BookingItemType)
  type: BookingItemType;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  hotelId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  roomNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(80)
  roomType?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'checkIn must be YYYY-MM-DD' })
  checkIn?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-07-05' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'checkOut must be YYYY-MM-DD' })
  checkOut?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  tourId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  driverId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  vehicleId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'serviceDate must be YYYY-MM-DD' })
  serviceDate?: string | null;

  @ApiPropertyOptional({ default: 0, description: 'What the client pays' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  salePrice?: number | null;

  @ApiPropertyOptional({ default: 0, description: 'What we pay the supplier' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  costPrice?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supplierPaid?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}

export class BookingCommissionDto {
  @ApiPropertyOptional({ description: 'Existing commission to update' })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  id?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  partnerId?: string | null;

  @ApiPropertyOptional({ description: 'Falls back to the partner name' })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(160)
  recipientName?: string | null;

  @ApiProperty({ enum: CommissionKind })
  @IsEnum(CommissionKind)
  kind: CommissionKind;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Driver whose earnings a driver referral is based on',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  driverId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Percent (0–100)' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate?: number | null;

  @ApiPropertyOptional({ description: 'Used when no rate is given' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  amount?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(300)
  note?: string | null;
}

export class CreateBookingDto {
  @ApiProperty({ enum: BookingType })
  @IsEnum(BookingType)
  type: BookingType;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  touristName: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  touristPhone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @MaxLength(254)
  touristEmail?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(80)
  touristCountry?: string | null;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  adults?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  children?: number;

  @ApiProperty({ example: '2026-07-01' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-07-05' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(DATE_ONLY_REGEX, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string | null;

  @ApiPropertyOptional({ enum: Currency, default: Currency.GEL })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ default: 0, description: 'Received from the client' })
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000000)
  paidAmount?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  paymentMethod?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Who brought the client',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  referrerId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Website tour order' })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  tourOrderId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Website transfer order',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  transferOrderId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(4000)
  notes?: string | null;

  @ApiPropertyOptional({ type: [BookingItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items?: BookingItemDto[];

  @ApiPropertyOptional({ type: [BookingCommissionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BookingCommissionDto)
  commissions?: BookingCommissionDto[];

  @ApiPropertyOptional({
    description: 'Owner; only users with access to all records may set it',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  createdById?: string | null;
}

export class UpdateBookingDto extends CreateBookingDto {
  @ApiPropertyOptional({ enum: BookingType })
  @IsOptional()
  @IsEnum(BookingType)
  declare type: BookingType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  declare touristName: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'startDate must be YYYY-MM-DD' })
  declare startDate: string;
}

export class ChangeBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class SupplierPaidDto {
  @ApiProperty()
  @IsBoolean()
  supplierPaid: boolean;
}

export class CommissionPaidDto {
  @ApiProperty()
  @IsBoolean()
  paid: boolean;
}

export class DraftFromOrderQueryDto {
  @ApiProperty({ enum: ['TOUR', 'TRANSFER'] })
  @IsIn(['TOUR', 'TRANSFER'])
  type: 'TOUR' | 'TRANSFER';

  @ApiProperty()
  @Transform(trimToUndefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  id: string;
}
