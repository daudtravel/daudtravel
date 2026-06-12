import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  languages?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  dailyRentPrice?: number | null;
}

export class RemoveCarPhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;
}
