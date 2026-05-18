import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('channels') getChannels(@CurrentUser('id') userId: string) { return this.chat.getChannels(userId); }
  @Get('channels/:id/messages') getMessages(@Param('id') id: string, @Query('page') page?: number) { return this.chat.getMessages(id, page); }
  @Post('channels/:id/messages') sendMessage(@Param('id') id: string, @Body('content') content: string, @CurrentUser('id') userId: string) { return this.chat.sendMessage(id, userId, content); }
  @Post('channels/:id/join') join(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.chat.joinChannel(id, userId); }
}
