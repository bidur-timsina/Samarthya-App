import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: 'live' })
export class LiveSessionsGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join-room')
  handleJoin(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    client.to(data.roomId).emit('user-joined', { userId: data.userId });
  }

  @SubscribeMessage('leave-room')
  handleLeave(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
    client.to(data.roomId).emit('user-left', { userId: data.userId });
  }

  @SubscribeMessage('chat-message')
  handleMessage(@MessageBody() data: { roomId: string; message: string; userId: string; userName: string }) {
    this.server.to(data.roomId).emit('chat-message', { userId: data.userId, userName: data.userName, message: data.message, timestamp: new Date() });
  }

  @SubscribeMessage('raise-hand')
  handleRaiseHand(@MessageBody() data: { roomId: string; userId: string }) {
    this.server.to(data.roomId).emit('hand-raised', { userId: data.userId });
  }
}
