import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { Article, JobState } from '@prisma/client';
import * as console from 'node:console';
import { ConfigService } from '@nestjs/config';
import slugify from 'slugify';
import { NewsImporterPort } from '../common/ports/news-importer.port';
import { CronRepositoryPort } from '../common/ports/cron-repository.port';
import axios from 'axios';
import { ArticleRepositoryPort } from '../common/ports/article-repository.port';
import { Topic } from '../../prisma/interfaces';

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

  /**
   * Constructor for NewsApiService.
   * @param websocketsGateway - The Websockets gateway for real-time communication.
   * @param configService - The configuration service for accessing environment variables.
   * @param newsRepository - The news repository service for database operations.
   */
  constructor(
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly configService: ConfigService,
    private readonly newsRepository: CronRepositoryPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {
    if (!this.newsApiUrl) {
      throw new Error('NEWS_API_URL is not defined in environment variables');
    }
    if (!this.apiKey) {
      throw new Error('NEWS_API_KEY is not defined in environment variables');
    }
  }

  /**
   * Imports news articles from an external service.
   * @param cron - The state of the cron job.
   */
  async importNews(cron: JobState): Promise<void> {
    // Set the default topic to 'general' if it doesn't exist
    const topic: Topic =
      await this.articleRepository.getOrCreateTopic('general');

    const apiResponse = await this.fetchNewsFromExternalService(
      cron,
      topic.name,
    );
    const newsData = apiResponse.data;
    if (!newsData || !newsData.status || newsData.status !== 'ok') {
      this.logger.error('Error fetching news from external service');
      return;
    }

    const newArticles = newsData.articles;
    if (!newArticles || newArticles.length === 0) {
      this.logger.log('No new articles. Resetting to page 1.');
      await this.newsRepository.updateCronJobData({
        ...cron,
        page: 1,
        lastPublishedAt: new Date(),
      });
      return;
    }

    await this.saveIncomingArticles(newArticles, topic);

    await this.updateJobStateInDatabase(newArticles, cron);

    this.logger.log(
      `Fetched ${newArticles.length} new articles. Updated job state.`,
    );

    // Send notification to clients
    // this.sendNotification(newsData);
  }

  private async saveIncomingArticles(newArticles: any, topic: Topic) {
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
        topics: [topic],
      };
    });
    await this.articleRepository.saveArticles(articlesToSave);
  }

  private async updateJobStateInDatabase(newArticles: any[], cron: JobState) {
    // Update job state in database
    const latestDate = newArticles.length
      ? new Date(newArticles[0].publishedAt)
      : cron.lastPublishedAt;

    await this.newsRepository.updateCronJobData({
      ...cron,
      lastPublishedAt: latestDate,
      page: cron.page + 1,
    });
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
   * Fetches news from an external service.
   * @param cron - The state of the cron job.
   */
  private async fetchNewsFromExternalService(
    cron: JobState,
    topic: string,
  ): Promise<any> {
    const { page, pageSize } = cron || {
      page: 1,
      pageSize: 10,
    };

    try {
      const params = {
        apiKey: this.apiKey,
        pageSize,
        page,
        country: 'us',
        category: topic.toLowerCase(),
      };
      this.logger.debug(
        `Fetching news from external service: ${this.newsApiUrl} with params: ${JSON.stringify(params)}`,
      );
      return axios.get(this.newsApiUrl, { params });
    } catch (error) {
      console.error('Error fetching news from external service');
      console.error(error);
      return;
    }
  }
}
