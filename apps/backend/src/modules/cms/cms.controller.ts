import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private cms: CmsService) {}

  @Get('banners') getBanners(@Query('all') all?: string) { return this.cms.getBanners(all === 'true'); }
  @Get('announcements') getAnnouncements() { return this.cms.getAnnouncements(); }

  @Post('banners')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createBanner(@Body() dto: any) { return this.cms.createBanner(dto); }

  @Patch('banners/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateBanner(@Param('id') id: string, @Body() dto: any) { return this.cms.updateBanner(id, dto); }

  @Delete('banners/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteBanner(@Param('id') id: string) { return this.cms.deleteBanner(id); }

  @Post('announcements')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createAnnouncement(@Body() dto: any, @CurrentUser('id') userId: string) { return this.cms.createAnnouncement(dto, userId); }

  @Patch('announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateAnnouncement(@Param('id') id: string, @Body() dto: any) { return this.cms.updateAnnouncement(id, dto); }

  @Delete('announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteAnnouncement(@Param('id') id: string) { return this.cms.deleteAnnouncement(id); }
}
