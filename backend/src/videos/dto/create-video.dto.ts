// src/videos/dto/create-video.dto.ts
import { IsString, IsNotEmpty, IsUrl, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  url: string;

  @ApiProperty({ example: 'Travel Guide to Tbilisi', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiProperty({
    example: 'A comprehensive guide to visiting Tbilisi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'travel', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
