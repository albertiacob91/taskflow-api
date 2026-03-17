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

  private presence = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    // eslint-disable-next-line no-console
    console.log(`ws connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [projectId, clients] of this.presence.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);

        this.server
          .to(`project:${projectId}`)
          .emit('presenceUpdated', { count: clients.size });

        if (clients.size === 0) {
          this.presence.delete(projectId);
        }
      }
    }

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

    if (!this.presence.has(body.projectId)) {
      this.presence.set(body.projectId, new Set());
    }

    this.presence.get(body.projectId)!.add(client.id);

    this.server.to(room).emit('presenceUpdated', {
      count: this.presence.get(body.projectId)!.size,
    });

    return { ok: true, room };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @MessageBody() body: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project:${body.projectId}`;

    client.leave(room);

    const clients = this.presence.get(body.projectId);

    if (clients) {
      clients.delete(client.id);

      this.server.to(room).emit('presenceUpdated', {
        count: clients.size,
      });

      if (clients.size === 0) {
        this.presence.delete(body.projectId);
      }
    }

    return { ok: true, room };
  }

  emitProjectEvent(projectId: string, event: string, payload: unknown) {
    this.server.to(`project:${projectId}`).emit(event, payload);
  }
}