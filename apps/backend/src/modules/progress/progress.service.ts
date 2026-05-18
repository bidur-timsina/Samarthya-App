import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async saveProgress(userId: string, lessonId: string, position: number, completed: boolean) {
    return this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, position, completed },
      update: { position, completed },
    });
  }

  async getCourseProgress(userId: string, courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { chapter: { courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map(l => l.id);
    const progress = await this.prisma.progress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    return { lessonIds, progress };
  }

  async getLessonProgress(userId: string, lessonId: string) {
    return this.prisma.progress.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  }
}
