import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Article } from '@prisma/client';

export interface INewsRepositoryPort {
  getLastPublishedNewsByCronJob(cronJobName: string): Promise<any>;

  saveLastPublishedNewsByCronJob(
    cronJobName: string,
    lastPublishedNewsDate: string,
  ): Promise<void>;

  saveArticles(articles: Article[]): Promise<void>;
}

@Injectable()
export class NewsRepositoryService implements INewsRepositoryPort {
  private readonly logger = new Logger(NewsRepositoryService.name);

  constructor(private readonly prisma: PrismaService) {}
  async getLastPublishedNewsByCronJob(cronJobName: string): Promise<any> {
    this.logger.debug(
      `[NewsRepositoryService][getLastPublishedNewsByCronJob]. Getting last published news by cron job name: ${cronJobName}`,
    );

    try {
      const jobState = await this.prisma.jobState.findUnique({
        where: { name: cronJobName },
        select: { lastPublishedAt: true },
      });

      return jobState?.lastPublishedAt;
    } catch (error) {
      this.logger.error(
        `[NewsRepositoryService][getLastPublishedNewsByCronJob]. Error getting last published news by cron job name: ${cronJobName}`,
      );
      throw error;
    }
  }

  async saveLastPublishedNewsByCronJob(
    cronJobName: string,
    lastPublishedNewsDate: string,
  ): Promise<void> {
    this.logger.debug(
      `[NewsRepositoryService][saveLastPublishedNewsByCronJob]. Saving last published news by cron job name: ${cronJobName}`,
    );

    try {
      await this.prisma.jobState.upsert({
        where: { name: cronJobName },
        update: { lastPublishedAt: lastPublishedNewsDate },
        create: { name: cronJobName, lastPublishedAt: lastPublishedNewsDate },
      });
    } catch (error) {
      this.logger.error(
        `[NewsRepositoryService][saveLastPublishedNewsByCronJob]. Error saving last published news by cron job name: ${cronJobName}`,
      );
      throw error;
    }
  }

  async saveArticles(articles: Article[]): Promise<void> {
    this.logger.debug(
      `[NewsRepositoryService][saveArticles]. Saving articles: ${articles}`,
    );

    try {
      await this.prisma.article.createMany({
        data: articles,
      });
    } catch (error) {
      this.logger.error(
        `[NewsRepositoryService][saveArticles]. Error saving articles: ${articles}`,
      );
      throw error;
    }
  }
}
