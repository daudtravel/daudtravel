// src/faq/dto/create-faq.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FAQLocalizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  locale: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  answer: string;
}

export class CreateFaqDto {
  @ApiProperty({ type: [FAQLocalizationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FAQLocalizationDto)
  localizations: FAQLocalizationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
