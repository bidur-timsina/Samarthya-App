import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, avatar: true, bio: true, location: true, role: true, isVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: { name?: string; bio?: string; location?: string; avatar?: string }) {
    // Students can update name, bio, location, avatar — NOT email or phone
    const { name, bio, location, avatar } = dto;
    return this.prisma.user.update({
      where: { id: userId },
      data: { name, bio, location, avatar },
      select: { id: true, name: true, email: true, phone: true, avatar: true, bio: true, location: true },
    });
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { fcmToken } });
    return { message: 'FCM token updated' };
  }

  async getAll(page = 1, limit = 20, search?: string, role?: string) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    // Default to STUDENT; pass role=ALL to get everyone, or specific role like TEACHER
    const where: any = role === 'ALL' ? {} : { role: role ?? 'STUDENT' };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  }

  async adminCreate(dto: { name: string; email: string; phone?: string; password?: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const password = await bcrypt.hash(dto.password ?? 'Student@123', 12);
    return this.prisma.user.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, password, role: (dto.role as any) ?? 'STUDENT', isVerified: true },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async adminUpdate(id: string, dto: { name?: string; email?: string; phone?: string; bio?: string; location?: string; avatar?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, bio: true, location: true },
    });
  }

  async adminDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    return this.prisma.user.delete({ where: { id } });
  }
}
