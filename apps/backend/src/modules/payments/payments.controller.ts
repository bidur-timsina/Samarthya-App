import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('esewa/initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  initiateEsewa(@Body('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.payments.initiateEsewa(userId, courseId);
  }

  @Get('esewa/verify')
  verifyEsewa(@Query('data') data: string) {
    return this.payments.verifyEsewa(data);
  }

  @Post('khalti/initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  initiateKhalti(@Body('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.payments.initiateKhalti(userId, courseId);
  }

  @Post('khalti/verify')
  verifyKhalti(@Body('pidx') pidx: string) {
    return this.payments.verifyKhalti(pidx);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAll() {
    return this.payments.getAll();
  }
}
