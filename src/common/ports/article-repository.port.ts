import { Article, Topic } from '../../../prisma/interfaces';

export abstract class ArticleRepositoryPort {
  abstract saveArticles(article: Article[]): Promise<any>;

  abstract getTopics(): Promise<Topic[]>;

  abstract getOrCreateTopic(topic: string): Promise<Topic>;
}
