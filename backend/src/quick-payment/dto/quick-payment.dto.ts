import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEmail,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuickLinkDto {
  @ApiProperty({ example: 'Premium Package' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Access to all premium features' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'base64_image_string' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Show this link on public website',
  })
  @IsBoolean()
  @IsOptional()
  showOnWebsite?: boolean;
}

export class UpdateQuickLinkDto {
  @ApiPropertyOptional({ example: 'Updated Package Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'base64_image_string' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 149.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Show this link on public website',
  })
  @IsBoolean()
  @IsOptional()
  showOnWebsite?: boolean;
}

export class InitiatePaymentDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customerFullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsString()
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({ example: '+995555123456' })
  @IsString()
  @IsOptional()
  customerPhone?: string;
}
