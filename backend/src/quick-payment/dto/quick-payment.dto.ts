// quick-payment.dto.ts

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEmail,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuickLinkLocalizationDto {
  @ApiProperty({ example: 'ka' })
  @IsString()
  @MaxLength(10)
  locale: string;

  @ApiProperty({ example: 'გამომძიებლის მომსახურება' })
  @IsString()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({ example: 'სრული აღწერა ქართულად' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
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
  @Min(0.01)
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
  @MaxLength(200)
  customerFullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({ example: '+995555123456' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({
    example: 'ka',
    description: 'Preferred language locale',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantity (default: 1, min: 1, max: 100)',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  quantity?: number;
}
