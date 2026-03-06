import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // simple connection log
    // eslint-disable-next-line no-console
    console.log(`ws connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // eslint-disable-next-line no-console
    console.log(`ws disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @MessageBody() body: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project:${body.projectId}`;
    client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @MessageBody() body: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project:${body.projectId}`;
    client.leave(room);
    return { ok: true, room };
  }

  emitProjectEvent(projectId: string, event: string, payload: unknown) {
    this.server.to(`project:${projectId}`).emit(event, payload);
  }
}