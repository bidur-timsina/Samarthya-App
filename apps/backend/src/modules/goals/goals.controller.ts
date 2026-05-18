import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private goals: GoalsService) {}

  @Get('my') getMyStats(@CurrentUser('id') userId: string) { return this.goals.getMyStats(userId); }
  @Post() createGoal(@CurrentUser('id') userId: string, @Body() dto: any) { return this.goals.createGoal(userId, dto); }
}
