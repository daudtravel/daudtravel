import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { trimToNull } from '@/common/dto/transforms';

export class AssignDriverDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Driver id, or null to remove the assignment',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  driverId?: string | null;
}
