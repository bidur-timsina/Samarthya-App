import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { totp } from 'otplib';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hash,
        xp: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await this.sendOtp(user.id, user.email);
    return { message: 'Registered successfully. Please verify your email.', userId: user.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new UnauthorizedException('Please verify your email first');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async verifyOtp(userId: string, code: string) {
    const otp = await this.prisma.oTP.findFirst({
      where: { userId, code, used: false, expiresAt: { gt: new Date() } },
    });
    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.$transaction([
      this.prisma.oTP.update({ where: { id: otp.id }, data: { used: true } }),
      this.prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) throw new BadRequestException('Already verified');
    await this.sendOtp(user.id, user.email);
    return { message: 'OTP sent' };
  }

  async refreshTokens(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    return { message: 'Logged out' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, you will receive reset instructions' };
    await this.sendOtp(user.id, email);
    return { message: 'Password reset OTP sent to your email' };
  }

  async resetPassword(userId: string, code: string, newPassword: string) {
    await this.verifyOtp(userId, code);
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
    return { message: 'Password reset successfully' };
  }

  private async sendOtp(userId: string, email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.oTP.create({ data: { userId, code, expiresAt } });
    await this.mail.sendOtp(email, code);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({ data: { userId, token: refreshToken, expiresAt } });

    return { accessToken, refreshToken, userId, role };
  }
}
