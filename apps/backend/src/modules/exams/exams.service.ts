import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: { courseId?: string; type?: string; status?: string }) {
    const { courseId, type, status } = query;
    const where: any = { chapterId: null }; // only standalone exams
    if (courseId) where.courseId = courseId;
    if (type) where.type = type;
    if (status) where.status = status;

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        course: { select: { title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId, examId: { in: exams.map(e => e.id) } },
      select: { examId: true, score: true, passed: true, completedAt: true },
    });

    const attemptMap = new Map(attempts.map(a => [a.examId, a]));

    return exams.map(exam => ({
      ...exam,
      questionCount: exam._count.questions,
      attemptCount: exam._count.attempts,
      myAttempt: attemptMap.get(exam.id) ?? null,
    }));
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async getChapterExam(chapterId: string) {
    return this.prisma.exam.findFirst({
      where: { chapterId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async createChapterExam(chapterId: string, dto: { title: string; duration?: number; passMark?: number }) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw new NotFoundException('Chapter not found');

    // Only one exam per chapter
    const existing = await this.prisma.exam.findFirst({ where: { chapterId } });
    if (existing) return existing;

    return this.prisma.exam.create({
      data: {
        chapterId,
        courseId: chapter.courseId,
        title: dto.title,
        duration: dto.duration ?? 30,
        passMark: dto.passMark ?? 40,
        type: 'PRACTICE',
      },
      include: { questions: true },
    });
  }

  async updateExam(examId: string, dto: any) {
    const { questions, ...examData } = dto;

    // Update exam fields
    await this.prisma.exam.update({ where: { id: examId }, data: examData });

    if (questions && Array.isArray(questions)) {
      const incomingIds = questions.filter(q => q.id).map(q => q.id);

      // Delete questions that were removed
      await this.prisma.question.deleteMany({
        where: { examId, id: { notIn: incomingIds } },
      });

      // Upsert each question
      for (const q of questions) {
        const { id, ...qData } = q;
        if (id) {
          await this.prisma.question.update({ where: { id }, data: qData });
        } else {
          await this.prisma.question.create({ data: { ...qData, examId } });
        }
      }
    }

    return this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteExam(examId: string) {
    return this.prisma.exam.delete({ where: { id: examId } });
  }

  async addQuestion(examId: string, dto: any) {
    const count = await this.prisma.question.count({ where: { examId } });
    return this.prisma.question.create({
      data: { ...dto, examId, order: count + 1 },
    });
  }

  async updateQuestion(questionId: string, dto: any) {
    return this.prisma.question.update({ where: { id: questionId }, data: dto });
  }

  async deleteQuestion(questionId: string) {
    return this.prisma.question.delete({ where: { id: questionId } });
  }

  async startAttempt(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const attempt = await this.prisma.examAttempt.create({
      data: { userId, examId, answers: {}, total: exam.questions.length },
    });

    return {
      attemptId: attempt.id,
      questions: exam.questions.map(q => ({
        id: q.id,
        questionType: q.questionType,
        text: q.text,
        options: q.options,
        marks: q.marks,
        order: q.order,
      })),
      duration: exam.duration,
    };
  }

  async submitAttempt(userId: string, attemptId: string, answers: Record<string, any>) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } } },
    });
    if (!attempt || attempt.userId !== userId) throw new ForbiddenException();

    return this.scoreAndSave(userId, attempt.exam, attempt.id, answers);
  }

  /** Combined start + submit in a single call (used by mobile) */
  async attempt(userId: string, examId: string, answers: Record<string, any>) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const attempt = await this.prisma.examAttempt.create({
      data: { userId, examId, answers: {}, total: exam.questions.length },
    });

    return this.scoreAndSave(userId, exam, attempt.id, answers);
  }

  private async scoreAndSave(userId: string, exam: any, attemptId: string, answers: Record<string, any>) {
    let score = 0;
    for (const question of exam.questions) {
      if (question.questionType === 'OBJECTIVE' && answers[question.id] === question.correctAnswer) {
        score += question.marks;
      }
    }

    const total = exam.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
    const passed = total > 0 && (score / total) * 100 >= exam.passMark;

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { answers, score, total, passed, completedAt: new Date() },
    });

    if (passed) {
      await this.prisma.userXP.upsert({
        where: { userId },
        create: { userId, totalXP: 50 },
        update: { totalXP: { increment: 50 } },
      });
    }

    return { score, total, passed, percentage: total > 0 ? Math.round((score / total) * 100) : 0 };
  }

  async create(dto: any) {
    const { questions, ...examData } = dto;
    return this.prisma.exam.create({
      data: { ...examData, questions: { create: questions } },
      include: { questions: true },
    });
  }
}
