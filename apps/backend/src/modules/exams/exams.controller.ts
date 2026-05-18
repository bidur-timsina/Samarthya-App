import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private exams: ExamsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.exams.findAll(userId, query);
  }

  @Get('chapter/:chapterId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  getChapterExam(@Param('chapterId') chapterId: string) {
    return this.exams.getChapterExam(chapterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exams.findOne(id);
  }

  @Post(':id/start')
  startAttempt(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.exams.startAttempt(userId, id);
  }

  /** Single-step attempt: start + submit at once (used by mobile) */
  @Post(':id/attempt')
  attempt(
    @Param('id') id: string,
    @Body('answers') answers: Record<string, any>,
    @CurrentUser('id') userId: string,
  ) {
    return this.exams.attempt(userId, id, answers ?? {});
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @Param('attemptId') id: string,
    @Body('answers') answers: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.exams.submitAttempt(userId, id, answers);
  }

  // ── Admin: Chapter Exams ──────────────────────────────────────────────────

  @Post('chapter/:chapterId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  createChapterExam(@Param('chapterId') chapterId: string, @Body() dto: any) {
    return this.exams.createChapterExam(chapterId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  updateExam(@Param('id') id: string, @Body() dto: any) {
    return this.exams.updateExam(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  deleteExam(@Param('id') id: string) {
    return this.exams.deleteExam(id);
  }

  // ── Admin: Questions ──────────────────────────────────────────────────────

  @Post(':id/questions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  addQuestion(@Param('id') examId: string, @Body() dto: any) {
    return this.exams.addQuestion(examId, dto);
  }

  @Patch('questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  updateQuestion(@Param('questionId') questionId: string, @Body() dto: any) {
    return this.exams.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.exams.deleteQuestion(questionId);
  }

  // ── Standalone exam create ─────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  create(@Body() dto: any) {
    return this.exams.create(dto);
  }
}
