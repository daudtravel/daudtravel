import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { PaymentStatus, VehicleType } from '@prisma/client';
import { DATE_ONLY_REGEX, DateRangeQueryDto } from './pagination.dto';
import { trimToUndefined } from './transforms';

/**
 * Filters shared by the website order lists. `dateFrom`/`dateTo` filter the
 * order date; `serviceFrom`/`serviceTo` the travel date.
 */
export class BaseOrderListQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'serviceFrom must be YYYY-MM-DD' })
  serviceFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'serviceTo must be YYYY-MM-DD' })
  serviceTo?: string;
}

export class TourOrdersQueryDto extends BaseOrderListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  tourId?: string;
}

export class TransferOrdersQueryDto extends BaseOrderListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  transferId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
}

export const TOUR_ORDER_SORT_FIELDS = [
  'createdAt',
  'selectedDate',
  'paidAmount',
  'totalPrice',
  'status',
] as const;

export const TRANSFER_ORDER_SORT_FIELDS = [
  'createdAt',
  'transferDate',
  'paymentAmount',
  'status',
] as const;
