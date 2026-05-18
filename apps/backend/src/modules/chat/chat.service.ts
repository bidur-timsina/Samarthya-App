import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChannels(userId: string) {
    return this.prisma.channel.findMany({
      where: { members: { some: { userId } } },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { name: true } } } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessages(channelId: string, page = 1, limit = 50) {
    return this.prisma.message.findMany({
      where: { channelId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async sendMessage(channelId: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: { channelId, senderId, content },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async createCourseChannel(courseId: string, name: string) {
    const channel = await this.prisma.channel.create({ data: { courseId, type: 'COURSE', name } });
    return channel;
  }

  async joinChannel(channelId: string, userId: string) {
    return this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });
  }
}
