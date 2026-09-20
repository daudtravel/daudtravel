import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Currency, TransactionCategory, TransactionType } from '@prisma/client';
import {
  DATE_ONLY_REGEX,
  DateRangeQueryDto,
} from '@/common/dto/pagination.dto';
import {
  toNullableNumber,
  toStringArray,
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';

export const TRANSACTION_SORT_FIELDS = [
  'date',
  'createdAt',
  'amount',
  'title',
  'category',
] as const;

/** Which categories belong to which side of the ledger. */
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  TransactionCategory.OFFICE,
  TransactionCategory.SALARY,
  TransactionCategory.FUEL,
  TransactionCategory.VEHICLE_REPAIR,
  TransactionCategory.VEHICLE_SERVICE,
  TransactionCategory.RENT,
  TransactionCategory.UTILITIES,
  TransactionCategory.MARKETING,
  TransactionCategory.TAX,
  TransactionCategory.COMMUNICATION,
  TransactionCategory.OTHER_EXPENSE,
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  TransactionCategory.HOTEL_COMMISSION,
  TransactionCategory.SERVICE_INCOME,
  TransactionCategory.OTHER_INCOME,
];

export class ListTransactionsQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionCategory,
    isArray: true,
    description: 'One or more categories (comma separated)',
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsEnum(TransactionCategory, { each: true })
  categories?: TransactionCategory[];

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  hotelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  tourId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Staff member a salary was paid to' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(60)
  paymentMethod?: string;

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
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ example: '2026-07-01' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Always positive; the type says the direction' })
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000000)
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.GEL })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

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
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  paymentMethod?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  vehicleId?: string | null;

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
  hotelId?: string | null;

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
  bookingId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  employeeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  partnerId?: string | null;

  @ApiPropertyOptional({
    description: 'Owner; only users with access to all records may set it',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  createdById?: string | null;
}

export class UpdateTransactionDto extends CreateTransactionDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  declare type: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory })
  @IsOptional()
  @IsEnum(TransactionCategory)
  declare category: TransactionCategory;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  declare date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toNullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000000)
  declare amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare title: string;
}
