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
  async saveArticles(articles: Article[]): Promise<Article[]> {
    this.logger.debug(`Saving articles`);

    try {
      // Find existing articles in the database by slug
      const existingArticles = await this.prisma.article.findMany({
        where: { slug: { in: articles.map((article) => article.slug) } },
        select: { slug: true },
      });

      // Filter out articles that already exist in the database
      const articlesToSave = articles.filter(
        (article) =>
          !existingArticles.some((existing) => existing.slug === article.slug),
      );

      if (articles.length !== articlesToSave.length) {
        this.logger.debug(
          `Found ${articles.length - articlesToSave.length} existing articles`,
        );
        if (articlesToSave.length === 0) {
          this.logger.debug(`No new articles to save`);
          return [];
        }
      }

      // Insert new articles and retrieve their IDs
      const createdArticles = await Promise.all(
        articlesToSave.map(async ({ topics, ...articleData }) => {
          const createdArticle = await this.prisma.article.create({
            data: {
              title: articleData.title,
              summary: articleData.summary,
              link: articleData.link,
              publishedAt: articleData.publishedAt,
              slug: articleData.slug,
              views: articleData.views,
              authorName: articleData.authorName,
              image: articleData.image,
              source: articleData.source,
            },
          });

          // Link topics to the newly created article
          await this.prisma.article.update({
            where: { id: createdArticle.id },
            data: {
              topics: {
                connect: topics.map((topic) => ({ id: topic.id })),
              },
            },
          });

          // Return the created article with its ID and topics
          return {
            ...createdArticle,
            topics,
          };
        }),
      );

      return createdArticles;
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
