import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AuthStatusResponseDto,
  SendCodeDto,
  SendCodeResponseDto,
  SignInDto,
  SignInResponseDto,
  SignUpDto,
  SignUpResponseDto,
} from './dto/auth.dto';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('Authentication')
@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send_code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send verification code',
    description:
      'Sends a 6-digit verification code to the provided email address',
  })
  @ApiBody({ type: SendCodeDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Verification code sent successfully',
    type: SendCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'EMAIL_EXIST',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Verification code already sent, please wait',
    schema: {
      example: {
        statusCode: 429,
        message: 'VERIFICATION_CODE_ALREADY_SENT',
        timeRemaining: 120,
      },
    },
  })
  async sendVerificationCode(
    @Body() dto: SendCodeDto,
  ): Promise<SendCodeResponseDto> {
    try {
      await this.authService.sendVerificationCode(dto);

      return {
        message: 'CODE_SEND',
        email: dto.email,
      };
    } catch (error: any) {
      if (error.response?.timeRemaining !== undefined) {
        return {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: error.message,
          email: dto.email,
          timeRemaining: error.response.timeRemaining,
        };
      }
      throw error;
    }
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up with verification',
    description: 'Creates a new user account after verifying the email code',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: SignUpResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid verification code or validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'INVALID_VERIFICATION_CODE',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'EMAIL_EXIST',
      },
    },
  })
  async signUp(@Body() dto: SignUpDto): Promise<SignUpResponseDto> {
    const user = await this.authService.signUp(dto);

    return {
      user,
      message: 'USER_CREATED_SUCCESSFULLY',
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description: 'Authenticates user and returns JWT token',
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: SignInResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'INVALID_CREDENTIALS',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing credentials',
    schema: {
      example: {
        statusCode: 400,
        message: 'MISSING_CREDENTIALS',
      },
    },
  })
  async signIn(@Body() dto: SignInDto): Promise<SignInResponseDto> {
    const { user, token } = await this.authService.signIn(dto);

    return {
      message: 'LOGIN_SUCCESS',
      user,
      token,
    };
  }

  @Post('auth/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check authentication status',
    description: 'Returns current authenticated user information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User is authenticated',
    type: AuthStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired token',
      },
    },
  })
  async checkAuthStatus(@Request() req: any): Promise<AuthStatusResponseDto> {
    return { user: req.user };
  }
}
