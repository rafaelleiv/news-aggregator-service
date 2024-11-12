import { Article } from '@prisma/client';

export abstract class NewsRepositoryPort {
  abstract getLastPublishedNewsByCronJob(cronJobName: string): Promise<any>;

  abstract saveLastPublishedNewsByCronJob(
    cronJobName: string,
    lastPublishedNewsDate: string,
  ): Promise<void>;

  abstract saveArticles(articles: Article[]): Promise<void>;
}
