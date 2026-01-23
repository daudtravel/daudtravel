import {
  IsString,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InsurancePersonDto {
  @ApiProperty({ example: 'Lado Asambadze' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+995555123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Base64 encoded passport photo',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  passportPhoto: string;
}

export class CreateInsuranceSubmissionDto {
  @ApiProperty({ example: 'lado@example.com' })
  @IsEmail()
  @IsNotEmpty()
  submitterEmail: string;

  @ApiProperty({
    type: [InsurancePersonDto],
    description: 'Array of people to insure',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsurancePersonDto)
  people: InsurancePersonDto[];
}

export class UpdateInsuranceSettingsDto {
  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerPerson?: number;

  @ApiProperty({ example: 'admin@daudtravel.com' })
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
