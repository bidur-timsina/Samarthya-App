import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LiveSessionsService } from './live-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Live Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private sessions: LiveSessionsService) {}

  @Get() findAll(@Query('courseId') courseId?: string) { return this.sessions.findAll(courseId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.sessions.findOne(id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  create(@Body() dto: any, @CurrentUser('id') userId: string) { return this.sessions.create(dto, userId); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  update(@Param('id') id: string, @Body() dto: any) { return this.sessions.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  delete(@Param('id') id: string) { return this.sessions.delete(id); }

  @Patch(':id/start')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  start(@Param('id') id: string) { return this.sessions.start(id); }

  @Patch(':id/end')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  end(@Param('id') id: string, @Body('recordingUrl') url?: string) { return this.sessions.end(id, url); }
}
