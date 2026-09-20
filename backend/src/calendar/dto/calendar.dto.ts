import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_ONLY_REGEX } from '@/common/dto/pagination.dto';
import {
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';

/** Chip colours offered in the month view. */
export const NOTE_COLORS = [
  'green',
  'yellow',
  'blue',
  'red',
  'purple',
  'gray',
] as const;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CalendarQueryDto {
  @ApiProperty({ example: '2026-07-01' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'from must be YYYY-MM-DD' })
  from: string;

  @ApiProperty({ example: '2026-07-31' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'to must be YYYY-MM-DD' })
  to: string;

  @ApiPropertyOptional({ description: 'Only notes written by this user' })
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  createdById?: string;
}

export class CreateCalendarNoteDto {
  @ApiProperty({ example: '2026-07-01' })
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({ nullable: true, example: '09:30' })
  @IsOptional()
  @Transform(trimToNull)
  @Matches(TIME_REGEX, { message: 'time must be HH:mm' })
  time?: string | null;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(2000)
  content?: string | null;

  @ApiPropertyOptional({ enum: NOTE_COLORS })
  @IsOptional()
  @IsIn(NOTE_COLORS)
  color?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;

  @ApiPropertyOptional({
    description: 'Owner; only users with access to all records may set it',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(60)
  createdById?: string | null;
}

export class UpdateCalendarNoteDto extends CreateCalendarNoteDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Transform(trimToUndefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date must be YYYY-MM-DD' })
  declare date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare title: string;
}
