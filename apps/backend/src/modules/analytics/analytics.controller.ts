import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview') getOverview() { return this.analytics.getOverview(); }
  @Get('revenue') getRevenue() { return this.analytics.getRevenueChart(); }
  @Get('top-courses') getTopCourses() { return this.analytics.getTopCourses(); }
  @Get('recent-students') getRecentStudents() { return this.analytics.getRecentStudents(); }
  @Get('enrollment-trend') getEnrollmentTrend() { return this.analytics.getEnrollmentTrend(); }
}
