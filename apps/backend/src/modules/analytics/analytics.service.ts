import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalStudents, totalCourses, totalRevenue, totalEnrollments] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalStudents,
      totalCourses,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      totalEnrollments,
    };
  }

  async getRevenueChart() {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) };
    }).reverse();

    const data = await Promise.all(
      months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const result = await this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        });
        return { month: label, revenue: Number(result._sum.amount ?? 0) };
      }),
    );

    return data;
  }

  async getTopCourses() {
    return this.prisma.course.findMany({
      where: { isPublished: true },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    });
  }

  async getRecentStudents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getEnrollmentTrend() {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short' }) };
    }).reverse();

    const data = await Promise.all(
      months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const enrollments = await this.prisma.enrollment.count({
          where: { enrolledAt: { gte: start, lte: end } },
        });
        return { month: label, enrollments };
      }),
    );

    return data;
  }
}
