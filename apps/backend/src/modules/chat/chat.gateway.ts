import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;
  constructor(private chat: ChatService) {}

  @SubscribeMessage('join-channel')
  handleJoin(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.channelId);
  }

  @SubscribeMessage('send-message')
  async handleMessage(@MessageBody() data: { channelId: string; content: string; senderId: string }) {
    const message = await this.chat.sendMessage(data.channelId, data.senderId, data.content);
    this.server.to(data.channelId).emit('new-message', message);
  }
}
