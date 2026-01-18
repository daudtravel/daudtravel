// src/faq/dto/create-faq.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FAQLocalizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
