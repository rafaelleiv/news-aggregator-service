import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Article, Topic } from '../../../prisma/interfaces';
import { ArticleRepositoryPort } from '../ports/article-repository.port';

@Injectable()
export class ArticleRepositoryService implements ArticleRepositoryPort {
  private readonly logger = new Logger(ArticleRepositoryService.name);

  /**
   * Constructor for NewsRepositoryService.
   * @param prisma - The Prisma service for database operations.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a list of articles to the database.
   * @param articles - The list of articles to save.
   */
  async saveArticles(articles: Article[]): Promise<void> {
    this.logger.debug(`Saving articles`);
    try {
      const existingArticles = await this.prisma.article.findMany({
        where: { slug: { in: articles.map((article) => article.slug) } },
      });
      const articlesToSave = articles.filter(
        (article) =>
          !existingArticles.some((existing) => existing.slug === article.slug),
      );
      await this.prisma.article.createMany({ data: articlesToSave });
    } catch (error) {
      this.logger.error(`Error saving articles`);
      throw error;
    }
  }

  async getTopics(): Promise<Topic[]> {
    try {
      return await this.prisma.topic.findMany();
    } catch (error) {
      this.logger.error(`Error getting topics`);
      throw error;
    }
  }

  async getOrCreateTopic(topic: string): Promise<Topic> {
    try {
      const normalizeTopic = topic.toLowerCase().trim();
      return await this.prisma.topic.upsert({
        where: { name: normalizeTopic },
        update: {},
        create: { name: normalizeTopic },
      });
    } catch (error) {
      this.logger.error(`Error getting or creating topic`);
      throw error;
    }
  }
}
