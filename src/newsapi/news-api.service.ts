import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { Article, JobState } from '@prisma/client';
import * as console from 'node:console';
import { ConfigService } from '@nestjs/config';
import slugify from 'slugify';
import { NewsImporterPort } from '../common/ports/news-importer.port';
import { NewsRepositoryPort } from '../common/ports/news-repository.port';
import axios from 'axios';

interface ArticleFromApi {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  author: string;
}

@Injectable()
export class NewsApiService implements NewsImporterPort {
  private readonly logger = new Logger(NewsApiService.name);
  private readonly newsApiUrl = this.configService.get<string>('NEWS_API_URL');
  private readonly apiKey = this.configService.get<string>('NEWS_API_KEY');
  private readonly newsCountLimit = this.configService.get<number>(
    'NEWS_API_LIMIT_BY_CALL',
  );

  /**
   * Constructor for NewsApiService.
   * @param prismaService - The Prisma service for database operations.
   * @param websocketsGateway - The Websockets gateway for real-time communication.
   * @param configService - The configuration service for accessing environment variables.
   * @param newsRepository - The news repository service for database operations.
   */
  constructor(
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly configService: ConfigService,
    private readonly newsRepository: NewsRepositoryPort,
  ) {
    if (!this.newsApiUrl) {
      throw new Error('NEWS_API_URL is not defined in environment variables');
    }
    if (!this.apiKey) {
      throw new Error('NEWS_API_KEY is not defined in environment variables');
    }
  }

  /**
   * Imports news articles from an external service and saves them to the database.
   * @param cronName - The name of the cron job.
   * @param lastPublishedArticleDate - The date of the last published article.
   */
  async importNews(cron: JobState): Promise<void> {
    const apiResponse = await this.fetchNewsFromExternalService(cron);
    const newsData = apiResponse.data;
    if (!newsData || !newsData.status || newsData.status !== 'ok') {
      this.logger.error('Error fetching news from external service');
      return;
    }

    const articles = newsData.articles;
    if (!articles || articles.length === 0) {
      this.logger.log('No new articles. Resetting to page 1.');
      await this.newsRepository.updateCronJobData({
        ...cron,
        page: 1,
        lastPublishedAt: new Date(),
      });
      return;
    }

    // Filter new articles based on last published date
    const newArticles = articles.filter(
      (article: any) =>
        new Date(article.publishedAt) > new Date(cron.lastPublishedAt),
    );

    // Save articles to database
    const articlesToSave = newArticles.map((article: ArticleFromApi) => {
      const {
        title,
        description,
        url,
        urlToImage,
        publishedAt,
        source,
        author,
      } = article;
      return {
        title,
        description,
        url,
        imageUrl: urlToImage,
        publishedAt,
        source: source.name,
        author,
        slug: slugify(title, { lower: true, strict: true }),
        views: 0,
      };
    });
    // await this.newsRepository.saveArticles(articlesToSave);

    // Update job state in database
    const latestDate = newArticles.length
      ? new Date(newArticles[0].publishedAt)
      : cron.lastPublishedAt;

    await this.newsRepository.updateCronJobData({
      ...cron,
      lastPublishedAt: latestDate,
      page: cron.page + 1,
    });

    this.logger.log(
      `Fetched ${newArticles.length} new articles. Updated job state.`,
    );

    // Send notification to clients
    // this.sendNotification(newsData);
  }

  /**
   * Sends a notification to clients about a new article.
   * @param article - The article to notify about.
   */
  sendNotification(article: Article): void {
    console.log('Sending notification to clients', article);
    throw new Error('Method not implemented.');
  }

  /**
   * Fetches news articles from an external service.
   * @param lastPublishedArticleDate - The date of the last published article.
   * @returns The response from the external service.
   */
  private async fetchNewsFromExternalService(cron: JobState) {
    const { page, pageSize } = cron || {
      page: 1,
      pageSize: 10,
    };

    try {
      return axios.get(this.newsApiUrl, {
        params: {
          apiKey: this.apiKey,
          pageSize,
          page,
          country: 'us',
          category: 'general',
        },
      });
    } catch (error) {
      console.error('Error fetching news from external service');
      console.error(error);
      return;
    }
  }
}
