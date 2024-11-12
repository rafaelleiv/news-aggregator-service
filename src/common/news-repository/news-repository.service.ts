import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Article } from '@prisma/client';
import { NewsRepositoryPort } from '../ports/news-repository.port';

@Injectable()
export class NewsRepositoryService implements NewsRepositoryPort {
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
        update: {
          lastPublishedAt: lastPublishedNewsDate,
          updatedAt: new Date(),
        },
        create: {
          name: cronJobName,
          lastPublishedAt: lastPublishedNewsDate,
          updatedAt: new Date(),
        },
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
      // validate articles by checking the slug against the database to avoid duplicates
      const existingArticles = await this.prisma.article.findMany({
        where: {
          OR: articles.map((article) => ({ slug: article.slug })),
        },
      });

      // save only the articles that are not already in the database
      const articlesToSave = articles.filter(
        (article) =>
          !existingArticles.some(
            (existingArticle) => existingArticle.slug === article.slug,
          ),
      );

      await this.prisma.article.createMany({
        data: articlesToSave,
      });
    } catch (error) {
      this.logger.error(
        `[NewsRepositoryService][saveArticles]. Error saving articles: ${articles}`,
      );
      throw error;
    }
  }
}
