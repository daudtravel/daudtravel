import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriverReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;

  @IsString()
  @IsNotEmpty()
  reviewerName: string;
}
