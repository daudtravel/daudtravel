import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AccessScope, PermissionModule } from '@prisma/client';
import { trimString, trimToNull } from '@/common/dto/transforms';

export const ROLE_SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;

export class RolePermissionDto {
  @ApiProperty({ enum: PermissionModule })
  @IsEnum(PermissionModule)
  module: PermissionModule;

  @ApiProperty()
  @IsBoolean()
  canView: boolean;

  @ApiProperty()
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty()
  @IsBoolean()
  canEdit: boolean;

  @ApiProperty()
  @IsBoolean()
  canDelete: boolean;

  @ApiProperty({ enum: AccessScope })
  @IsEnum(AccessScope)
  scope: AccessScope;
}

export class CreateRoleDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiProperty({ type: [RolePermissionDto] })
  @IsArray()
  @ArrayMaxSize(Object.values(PermissionModule).length)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions: RolePermissionDto[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiPropertyOptional({ type: [RolePermissionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(Object.values(PermissionModule).length)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions?: RolePermissionDto[];
}
