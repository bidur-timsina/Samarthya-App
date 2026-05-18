import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get() getAll(@CurrentUser('id') userId: string) { return this.notifications.getMyNotifications(userId); }
  @Get('unread-count') getCount(@CurrentUser('id') userId: string) { return this.notifications.getUnreadCount(userId); }
  @Patch(':id/read') markRead(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.notifications.markRead(id, userId); }
  @Patch('read-all') markAllRead(@CurrentUser('id') userId: string) { return this.notifications.markAllRead(userId); }
}
