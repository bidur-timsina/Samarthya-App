import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me') getMe(@CurrentUser('id') userId: string) { return this.users.getMe(userId); }
  @Patch('me') updateMe(@CurrentUser('id') userId: string, @Body() dto: any) { return this.users.updateMe(userId, dto); }
  @Patch('me/fcm-token') updateFcm(@CurrentUser('id') userId: string, @Body('fcmToken') token: string) { return this.users.updateFcmToken(userId, token); }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string, @Query('role') role?: string) { return this.users.getAll(page, limit, search, role); }

  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  toggleActive(@Param('id') id: string) { return this.users.toggleActive(id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminCreate(@Body() dto: any) { return this.users.adminCreate(dto); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminUpdate(@Param('id') id: string, @Body() dto: any) { return this.users.adminUpdate(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminDelete(@Param('id') id: string) { return this.users.adminDelete(id); }
}
