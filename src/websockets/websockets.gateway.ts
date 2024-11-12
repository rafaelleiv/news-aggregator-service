import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'news', cors: true })
export class WebsocketsGateway {
  @WebSocketServer() server: Server;

  private clientSubscriptions = new Map<
    string,
    { topics: number[]; states: number[] }
  >();

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { topics: number[]; states: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.clientSubscriptions.set(client.id, {
      topics: data.topics,
      states: data.states,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.clientSubscriptions.delete(client.id);
  }

  notifyClients(newsData: { topics: any[]; states: any[] }) {
    this.clientSubscriptions.forEach((subscriptions, clientId) => {
      const client = this.server.sockets.sockets.get(clientId);
      if (
        newsData.topics.some((topic) =>
          subscriptions.topics.includes(topic.id),
        ) ||
        newsData.states.some((state) => subscriptions.states.includes(state.id))
      ) {
        client?.emit('new-news', newsData);
      }
    });
  }
}
