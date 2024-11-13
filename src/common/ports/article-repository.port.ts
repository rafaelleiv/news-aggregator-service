import { Article, Topic } from '../../../prisma/interfaces';

export abstract class ArticleRepositoryPort {
  abstract saveArticles(
    article: Omit<Article, 'id' | 'authorId'>[],
  ): Promise<Article[]>;

  abstract getTopics(): Promise<Topic[]>;

  abstract getOrCreateTopic(topic: string): Promise<Topic>;
}
