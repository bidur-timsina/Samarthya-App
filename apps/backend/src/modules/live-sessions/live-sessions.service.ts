import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LiveSessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(courseId?: string) {
    const sessions = await this.prisma.liveSession.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return sessions.map(s => ({
      ...s,
      status: s.endedAt ? 'ENDED' : s.startedAt ? 'LIVE' : 'SCHEDULED',
    }));
  }

  async findOne(id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!session) throw new NotFoundException('Live session not found');
    return {
      ...session,
      status: session.endedAt ? 'ENDED' : session.startedAt ? 'LIVE' : 'SCHEDULED',
    };
  }

  async create(dto: any, instructorId: string) {
    const { courseId, ...rest } = dto;
    return this.prisma.liveSession.create({
      data: { ...rest, instructorId, ...(courseId ? { courseId } : {}) },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.liveSession.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.liveSession.delete({ where: { id } });
  }

  async start(id: string) {
    return this.prisma.liveSession.update({ where: { id }, data: { startedAt: new Date() } });
  }

  async end(id: string, recordingUrl?: string) {
    return this.prisma.liveSession.update({ where: { id }, data: { endedAt: new Date(), ...(recordingUrl ? { recordingUrl } : {}) } });
  }
}
