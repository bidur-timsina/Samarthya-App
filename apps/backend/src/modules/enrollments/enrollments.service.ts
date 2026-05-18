import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled');

    if (Number(course.price) === 0) {
      const enrollment = await this.prisma.enrollment.create({
        data: { userId, courseId },
        include: { course: { select: { title: true } } },
      });
      await this.prisma.payment.create({
        data: { userId, enrollmentId: enrollment.id, amount: 0, method: 'FREE', status: 'COMPLETED' },
      });
      return enrollment;
    }

    return { requiresPayment: true, courseId, price: course.price };
  }

  async getUserEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            category: true,
            _count: { select: { chapters: true } },
            chapters: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async getProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: {
          include: { chapters: { include: { lessons: true } } },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Not enrolled');

    const lessonIds = enrollment.course.chapters.flatMap(c => c.lessons.map(l => l.id));
    const completed = await this.prisma.progress.count({
      where: { userId, lessonId: { in: lessonIds }, completed: true },
    });

    return {
      totalLessons: lessonIds.length,
      completedLessons: completed,
      percentage: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0,
    };
  }

  async enrollByAdmin(userId: string, courseId: string, tier: string = 'BASIC') {
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Student is already enrolled in this course');

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId, tier: tier as any, status: 'ACTIVE' },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    await this.prisma.payment.create({
      data: { userId, enrollmentId: enrollment.id, amount: 0, method: 'FREE', status: 'COMPLETED' },
    });

    return enrollment;
  }

  async removeEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return this.prisma.enrollment.delete({ where: { id: enrollmentId } });
  }

  async getAll() {
    return this.prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }
}
