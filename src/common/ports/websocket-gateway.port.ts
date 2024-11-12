export abstract class WebsocketGatewayPort {
  abstract emitNewArticle(article: any): void;
}
