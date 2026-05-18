import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollments: EnrollmentsService) {}

  @Post(':courseId')
  enroll(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.enrollments.enroll(userId, courseId);
  }

  @Get('my')
  getMyEnrollments(@CurrentUser('id') userId: string) {
    return this.enrollments.getUserEnrollments(userId);
  }

  @Get('my/:courseId/progress')
  getProgress(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.enrollments.getProgress(userId, courseId);
  }

  // Admin: enroll any student in any course (bypasses payment)
  @Post('admin/enroll')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  enrollByAdmin(@Body() body: { userId: string; courseId: string; tier?: string }) {
    return this.enrollments.enrollByAdmin(body.userId, body.courseId, body.tier);
  }

  // Admin: remove enrollment
  @Delete('admin/:enrollmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  removeEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.enrollments.removeEnrollment(enrollmentId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAll() {
    return this.enrollments.getAll();
  }
}
