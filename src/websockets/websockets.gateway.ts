import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Article } from '../../prisma/interfaces';

@WebSocketGateway({ namespace: 'news', cors: true })
export class WebsocketsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNewsToTopic(topic: string, news: Article[]) {
    if (news.length === 0) {
      console.warn(`No articles to send for topic: ${topic}`);
    } else {
      console.log(`Sending news to ${topic}:`, news);
      this.server.to(topic).emit('newArticle', { topic, data: news });
    }
  }

  @SubscribeMessage('subscribeToTopic')
  handleSubscribe(client: Socket, topic: string) {
    client.join(topic);
    this.logger.log(`Client ${client.id} subscribed to topic: ${topic}`);
  }
}
