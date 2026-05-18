import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progress: ProgressService) {}

  @Post('lessons/:lessonId')
  save(@Param('lessonId') lessonId: string, @CurrentUser('id') userId: string, @Body() body: { position: number; completed: boolean }) {
    return this.progress.saveProgress(userId, lessonId, body.position, body.completed);
  }

  @Get('courses/:courseId')
  getCourse(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.progress.getCourseProgress(userId, courseId);
  }
}
