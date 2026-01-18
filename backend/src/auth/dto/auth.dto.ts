import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class SendCodeDto {
  @ApiProperty({
    description: 'Email address to send verification code',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class SignUpDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'User password (min 8 characters, must contain uppercase, lowercase, and number)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({
    description: '6-digit verification code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Verification code is required' })
  @MinLength(6, { message: 'Code must be 6 digits' })
  @MaxLength(6, { message: 'Code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}

export class SignInDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Admin status',
    example: false,
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-10T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2024-01-10T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class SendCodeResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'CODE_SEND',
  })
  message: string;

  @ApiProperty({
    description: 'Email where code was sent',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Status code (only for rate limit)',
    example: 429,
    required: false,
  })
  statusCode?: number;

  @ApiProperty({
    description: 'Time remaining in seconds before retry',
    example: 120,
    required: false,
  })
  timeRemaining?: number;
}

export class SignUpResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'USER_CREATED_SUCCESSFULLY',
  })
  message: string;

  @ApiProperty({
    description: 'Created user data',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class SignInResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'LOGIN_SUCCESS',
  })
  message: string;

  @ApiProperty({
    description: 'Authenticated user data',
    type: UserResponseDto,
  })
  user: Omit<UserResponseDto, 'password'>;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;
}

export class AuthStatusResponseDto {
  @ApiProperty({
    description: 'Current authenticated user',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
