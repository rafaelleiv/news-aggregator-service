import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { Article, JobState } from '@prisma/client';
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
  private topicsQueue: Topic[];

  constructor(
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly configService: ConfigService,
    private readonly newsRepository: CronRepositoryPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {
    if (!this.newsApiUrl || !this.apiKey) {
      throw new Error('NEWS_API_URL or NEWS_API_KEY is not defined');
    }
    this.topicsQueue = [];
    // Initialize category queue
    this.initializeTopicQueue().then();
  }

  private async initializeTopicQueue() {
    this.topicsQueue = (await this.articleRepository.getTopics()) || [];
    if (this.topicsQueue.length === 0) {
      this.topicsQueue.push({
        id: 1,
        name: 'general',
      }); // Fallback category
    }
  }

  async importNews(cron: JobState): Promise<void> {
    const topic = this.getNextTopic();

    const apiResponse = await this.fetchNewsFromExternalService(
      cron,
      topic.name,
    );

    if (!apiResponse || apiResponse.data.status !== 'ok') {
      this.logger.error('Error fetching news from external service');
      return;
    }

    const apiArticles = apiResponse.data.articles || [];
    if (apiArticles.length === 0) {
      this.logger.log('No articles returned from external service.');
      return;
    }

    const validArticles = apiArticles.filter(this.validateIncomingData);
    const savedArticles = await this.saveIncomingArticles(validArticles, topic);

    this.sendNotification(topic.name, savedArticles);
  }

  sendNotification(topicName: string, savedArticles: Article[]): void {
    this.websocketsGateway.sendNewsToTopic(topicName, savedArticles);
  }

  private getNextTopic(): Topic {
    const topic = this.topicsQueue.shift(); // Get the first category
    if (topic) {
      this.topicsQueue.push(topic); // Move it to the end of the queue
    }
    return (
      topic ?? {
        id: 1,
        name: 'general',
      }
    ); // Fallback if the queue is empty
  }

  private async saveIncomingArticles(
    newArticles: ArticleFromApi[],
    topic: Topic,
  ): Promise<Article[]> {
    const articlesToSave = newArticles.map((article) => ({
      title: article.title,
      summary: article.description,
      link: article.url,
      image: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      source: article.source.name,
      authorName: article.author,
      slug: slugify(article.title, { lower: true, strict: true }),
      views: 0,
      topics: [topic],
    }));
    return this.articleRepository.saveArticles(articlesToSave);
  }

  private async updateJobStateInDatabase(
    savedArticles: Article[],
    cron: JobState,
  ) {
    if (savedArticles.length === 0) {
      return;
    }
    const latestDate = savedArticles.length
      ? new Date(savedArticles[0].publishedAt)
      : cron.lastPublishedAt;

    await this.newsRepository.updateCronJobDataByName(cron.name, {
      lastPublishedAt: latestDate,
    });
  }

  private async resetPage(cronJobName: string) {
    await this.newsRepository.updateCronJobDataByName(cronJobName, { page: 1 });
  }

  private async incrementPage(cron: JobState) {
    await this.newsRepository.updateCronJobDataByName(cron.name, {
      page: cron.page + 1,
    });
  }

  private async fetchNewsFromExternalService(
    cron: JobState,
    topic: string,
  ): Promise<any> {
    const params = {
      apiKey: this.apiKey,
      pageSize: cron.pageSize,
      page: cron.page,
      country: 'us',
      category: topic.toLowerCase(),
    };
    this.logger.debug(
      `Fetching news from external service: ${this.newsApiUrl} with params: ${JSON.stringify(params)}`,
    );
    try {
      return axios.get(this.newsApiUrl, { params });
    } catch (error) {
      this.logger.error('Error fetching news from external service', error);
      return null;
    }
  }

  validateIncomingData(data: ArticleFromApi): boolean {
    return Boolean(
      data.title &&
        data.description &&
        data.url &&
        data.urlToImage &&
        data.publishedAt &&
        data.title.length > 0 &&
        data.description.length > 0 &&
        data.url.length > 0 &&
        data.urlToImage.length > 0 &&
        data.publishedAt.length > 0,
    );
  }
}
