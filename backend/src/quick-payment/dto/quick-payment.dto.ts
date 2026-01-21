// quick-payment.dto.ts

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuickLinkLocalizationDto {
  @ApiProperty({ example: 'ka' })
  @IsString()
  locale: string;

  @ApiProperty({ example: 'გამომძიებლის მომსახურება' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'სრული აღწერა ქართულად' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateQuickLinkDto {
  @ApiProperty({ type: [QuickLinkLocalizationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickLinkLocalizationDto)
  localizations: QuickLinkLocalizationDto[];

  @ApiPropertyOptional({ example: 'base64_image_string' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showOnWebsite?: boolean;
}

export class UpdateQuickLinkDto {
  @ApiPropertyOptional({ type: [QuickLinkLocalizationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickLinkLocalizationDto)
  @IsOptional()
  localizations?: QuickLinkLocalizationDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showOnWebsite?: boolean;
}

export class InitiatePaymentDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customerFullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  customerEmail: string;

  @ApiPropertyOptional({ example: '+995555123456' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({
    example: 'ka',
    description: 'Preferred language locale',
  })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantity (default: 1, min: 1, max: 100)',
  })
  @IsNumber()
  @IsOptional()
  quantity?: number; // ✅ NEW - user can select quantity from frontend
}
