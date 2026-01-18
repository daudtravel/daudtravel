import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { SendCodeDto, SignInDto, SignUpDto } from './dto/auth.dto';
 

interface VerificationCheckResult {
  isValid: boolean;
  timeRemaining?: number;
}

interface AuthResult {
  user: Omit<any, 'password'>;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly VERIFICATION_CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_SECONDS = 900;
  private readonly CODE_COOLDOWN_SECONDS = 120;
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async sendVerificationCode(dto: SendCodeDto): Promise<void> {
    await this.validateEmailNotExists(dto.email);
    await this.validateNoPendingVerification(dto.email);

    const verificationCode = this.generateVerificationCode();

    await this.prisma.emailVerification.upsert({
      where: { email: dto.email },
      update: {
        code: verificationCode,
        expiresAt: this.calculateExpiryDate(),
        createdAt: new Date(),
      },
      create: {
        email: dto.email,
        code: verificationCode,
        expiresAt: this.calculateExpiryDate(),
      },
    });

    await this.mailService.sendVerificationEmail(dto.email, verificationCode);
  }

  async signUp(dto: SignUpDto): Promise<any> {
    await this.validateEmailNotExists(dto.email);
    await this.validateVerificationCode(dto.email, dto.code);

    const hashedPassword = await this.hashPassword(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          isVerified: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isVerified: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.deleteVerificationCode(dto.email);

      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('EMAIL_EXIST');
      }
      throw error;
    }
  }

  async signIn(dto: SignInDto): Promise<AuthResult> {
    this.validateCredentialsProvided(dto.email, dto.password);

    const user = await this.findUserByEmail(dto.email);
    await this.validatePassword(dto.password, user.password);

    const { password, ...userWithoutPassword } = user;
    const token = this.generateAccessToken(user);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async cleanupExpiredCodes(): Promise<void> {
    const expiryThreshold = new Date(
      Date.now() - this.CODE_EXPIRY_SECONDS * 1000,
    );

    await this.prisma.emailVerification.deleteMany({
      where: {
        expiresAt: {
          lt: expiryThreshold,
        },
      },
    });
  }

  private async validateEmailNotExists(email: string): Promise<void> {
    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ConflictException('EMAIL_EXIST');
    }
  }

  private async validateNoPendingVerification(email: string): Promise<void> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      return;
    }

    const secondsSinceCreated = this.getSecondsSince(verification.createdAt);

    if (this.isExpired(secondsSinceCreated)) {
      await this.deleteVerificationCode(email);
      return;
    }

    if (this.isInCooldown(secondsSinceCreated)) {
      const timeRemaining = this.CODE_COOLDOWN_SECONDS - secondsSinceCreated;
      const error: any = new BadRequestException(
        'VERIFICATION_CODE_ALREADY_SENT',
      );
      error.timeRemaining = timeRemaining;
      error.response.timeRemaining = timeRemaining;
      throw error;
    }
  }

  private async validateVerificationCode(
    email: string,
    code: string,
  ): Promise<void> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: { email, code },
    });

    if (!verification) {
      throw new BadRequestException('INVALID_VERIFICATION_CODE');
    }

    const secondsSinceCreated = this.getSecondsSince(verification.createdAt);

    if (this.isExpired(secondsSinceCreated)) {
      await this.deleteVerificationCode(email);
      throw new BadRequestException('VERIFICATION_CODE_EXPIRED');
    }
  }

  private async findUserByEmail(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return user;
  }

  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);

    if (!isValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
  }

  private validateCredentialsProvided(email: string, password: string): void {
    if (!email || !password) {
      throw new BadRequestException('MISSING_CREDENTIALS');
    }
  }

  private generateVerificationCode(): string {
    const min = Math.pow(10, this.VERIFICATION_CODE_LENGTH - 1);
    const max = Math.pow(10, this.VERIFICATION_CODE_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
  }

  private generateAccessToken(user: any): string {
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    });
  }

  private calculateExpiryDate(): Date {
    return new Date(Date.now() + this.CODE_EXPIRY_SECONDS * 1000);
  }

  private getSecondsSince(date: Date): number {
    const timeDiff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(timeDiff / 1000);
  }

  private isExpired(seconds: number): boolean {
    return seconds >= this.CODE_EXPIRY_SECONDS;
  }

  private isInCooldown(seconds: number): boolean {
    return seconds < this.CODE_COOLDOWN_SECONDS;
  }

  private async deleteVerificationCode(email: string): Promise<void> {
    await this.prisma.emailVerification.delete({
      where: { email },
    });
  }
}
