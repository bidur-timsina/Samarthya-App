import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseLevel } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    category?: string;
    level?: CourseLevel;
    page?: number;
    limit?: number;
    sort?: string;
    all?: boolean | string;
  }) {
    const { search, category, level, page = 1, limit = 12, sort = 'createdAt', all } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = all === true || all === 'true' ? {} : { isPublished: true };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (category) where.category = { slug: category };
    if (level) where.level = level;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sort]: 'desc' },
        include: {
          category: true,
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, chapters: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses.map(c => ({
        ...c,
        avgRating: c.reviews.length ? c.reviews.reduce((a, r) => a + r.rating, 0) / c.reviews.length : 0,
        reviewCount: c.reviews.length,
        studentCount: c._count.enrollments,
        chapterCount: c._count.chapters,
      })),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async findOne(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, type: true, duration: true, isFree: true, order: true, videoUrl: true, content: true, pdfUrl: true } },
          },
        },
        reviews: { select: { id: true, rating: true, comment: true, userId: true, createdAt: true }, take: 10 },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    let isEnrolled = false;
    if (userId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      isEnrolled = !!enrollment;
    }

    return { ...course, isEnrolled, studentCount: (course as any)._count.enrollments };
  }

  async create(dto: CreateCourseDto, instructorId: string) {
    const slug = dto.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();
    const { categoryId, ...rest } = dto;
    return this.prisma.course.create({
      data: {
        ...rest,
        slug,
        instructorId,
        ...(categoryId ? { categoryId } : {}),
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto, userId: string, role: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (role !== 'ADMIN' && course.instructorId !== userId) throw new ForbiddenException();
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { courses: true } } } });
  }

  async createCategory(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return this.prisma.category.create({ data: { name, slug } });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            exams: {
              include: { questions: { orderBy: { order: 'asc' } } },
            },
          },
        },
        reviews: { select: { rating: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return {
      ...course,
      avgRating: course.reviews.length ? course.reviews.reduce((a, r) => a + r.rating, 0) / course.reviews.length : 0,
      studentCount: course._count.enrollments,
    };
  }

  async createChapter(courseId: string, title: string) {
    const count = await this.prisma.chapter.count({ where: { courseId } });
    return this.prisma.chapter.create({ data: { courseId, title, order: count + 1 } });
  }

  async deleteChapter(courseId: string, chapterId: string) {
    return this.prisma.chapter.delete({ where: { id: chapterId, courseId } });
  }

  async updateChapter(chapterId: string, dto: any) {
    return this.prisma.chapter.update({ where: { id: chapterId }, data: dto });
  }

  async createLesson(chapterId: string, dto: any) {
    const count = await this.prisma.lesson.count({ where: { chapterId } });
    return this.prisma.lesson.create({ data: { ...dto, chapterId, order: count + 1 } });
  }

  async updateLesson(lessonId: string, dto: any) {
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
  }

  async deleteLesson(lessonId: string) {
    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  async addReview(courseId: string, userId: string, rating: number, comment?: string) {
    // Must be enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('You must be enrolled to leave a review');

    return this.prisma.review.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { courseId, userId, rating, comment },
      update: { rating, comment },
    });
  }

  async deleteReview(courseId: string, userId: string) {
    return this.prisma.review.delete({
      where: { courseId_userId: { courseId, userId } },
    });
  }
}
