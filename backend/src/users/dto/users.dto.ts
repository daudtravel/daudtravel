import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import {
  toOptionalBoolean,
  trimString,
  trimToNull,
  trimToUndefined,
} from '@/common/dto/transforms';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../users.constants';

export const USER_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'email',
  'lastLoginAt',
] as const;

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isAdmin?: boolean;
}

class UserBaseDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty()
  @Transform(trimString)
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Job title' })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(80)
  position?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  roleIds?: string[];
}

export class CreateUserDto extends UserBaseDto {
  @ApiProperty({ description: '8+ characters with a letter and a digit' })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(80)
  position?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  roleIds?: string[];
}

export class SetUserPasswordDto {
  @ApiProperty({ description: '8+ characters with a letter and a digit' })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
