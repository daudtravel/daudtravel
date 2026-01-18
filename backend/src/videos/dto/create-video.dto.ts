// src/videos/dto/create-video.dto.ts
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'Travel Guide to Tbilisi', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'A comprehensive guide to visiting Tbilisi',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'travel', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
