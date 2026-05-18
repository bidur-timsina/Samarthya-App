import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ConflictException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.courses.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.courses.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  createCategory(@Body('name') name: string) {
    return this.courses.createCategory(name);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  deleteCategory(@Param('id') id: string) {
    return this.courses.deleteCategory(id);
  }

  // Admin-specific: get by ID (not slug) with full chapter/lesson data
  @Get(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  findById(@Param('id') id: string) {
    return this.courses.findById(id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.courses.findOne(slug, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  create(@Body() dto: CreateCourseDto, @CurrentUser('id') userId: string) {
    return this.courses.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: any) {
    return this.courses.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.courses.remove(id);
  }

  // ── Reviews ───────────────────────────────────────────────
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async addReview(
    @Param('id') courseId: string,
    @Body() body: { rating: number; comment?: string },
    @CurrentUser('id') userId: string,
  ) {
    if (!body.rating || body.rating < 1 || body.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');
    return this.courses.addReview(courseId, userId, body.rating, body.comment);
  }

  @Delete(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteReview(@Param('id') courseId: string, @CurrentUser('id') userId: string) {
    return this.courses.deleteReview(courseId, userId);
  }

  // ── Chapters ──────────────────────────────────────────────
  @Post(':id/chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  createChapter(@Param('id') id: string, @Body('title') title: string) {
    return this.courses.createChapter(id, title || 'New Chapter');
  }

  @Patch(':id/chapters/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  updateChapter(@Param('chapterId') chapterId: string, @Body() dto: any) {
    return this.courses.updateChapter(chapterId, dto);
  }

  @Delete(':id/chapters/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  deleteChapter(@Param('id') courseId: string, @Param('chapterId') chapterId: string) {
    return this.courses.deleteChapter(courseId, chapterId);
  }

  // ── Lessons ───────────────────────────────────────────────
  @Post(':id/chapters/:chapterId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  createLesson(
    @Param('chapterId') chapterId: string,
    @Body() dto: any,
  ) {
    return this.courses.createLesson(chapterId, dto);
  }

  @Patch(':id/chapters/:chapterId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  updateLesson(@Param('lessonId') lessonId: string, @Body() dto: any) {
    return this.courses.updateLesson(lessonId, dto);
  }

  @Delete(':id/chapters/:chapterId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.courses.deleteLesson(lessonId);
  }
}
