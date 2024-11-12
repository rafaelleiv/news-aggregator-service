import { Injectable, Logger } from '@nestjs/common';
import { INewsImporter } from '../common/interfaces/news-importer.interface';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import axios from 'axios';
import { Article } from '@prisma/client';
import * as console from 'node:console';
import { ConfigService } from '@nestjs/config';
import { buildQuery } from '../common/utils';
import { NewsRepositoryService } from '../common/news-repository/news-repository.service';
import slugify from 'slugify';

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
export class NewsApiService implements INewsImporter {
  private readonly logger = new Logger(NewsApiService.name);
  private readonly newsApiUrl = this.configService.get<string>('NEWS_API_URL');
  private readonly topics =
    this.configService.get<string>('NEWS_API_TOPICS') || '';
  private readonly apiKey = this.configService.get<string>('NEWS_API_KEY');
  private readonly newsCountLimit = this.configService.get<number>(
    'NEWS_API_LIMIT_BY_CALL',
  );

  constructor(
    private readonly prismaService: PrismaService,
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly configService: ConfigService,
    private readonly newsRepository: NewsRepositoryService,
  ) {
    if (!this.newsApiUrl) {
      throw new Error('NEWS_API_URL is not defined in environment variables');
    }
    if (!this.apiKey) {
      throw new Error('NEWS_API_KEY is not defined in environment variables');
    }
  }

  async importNews(lastPublishedArticleDate: string): Promise<void> {
    const apiResponse = await this.fetchNewsFromExternalService(
      lastPublishedArticleDate,
    );
    const newsData = apiResponse.data;
    console.log('News data', newsData);
    if (!newsData || !newsData.status || newsData.status !== 'ok') {
      this.logger.error('Error fetching news from external service');
      return;
    }

    const articles = newsData.articles;
    if (!articles || articles.length === 0) {
      this.logger.warn('No news found');
      return;
    }

    // Save articles to database
    const articlesToSave = articles.map((article: ArticleFromApi) => {
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
    await this.newsRepository.saveArticles(articlesToSave);

    // Send notification to clients
    // this.sendNotification(newsData);
  }

  sendNotification(article: Article): void {
    console.log('Sending notification to clients', article);
    throw new Error('Method not implemented.');
  }

  private async fetchNewsFromExternalService(lastPublishedArticleDate: string) {
    if (!lastPublishedArticleDate) {
      lastPublishedArticleDate = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago by default
      ).toISOString();
    }

    const q = buildQuery(this.topics.split(','));

    try {
      return await axios.get(this.newsApiUrl, {
        params: {
          q,
          from: lastPublishedArticleDate,
          to: new Date().toISOString(),
          sortBy: 'popularity',
          apiKey: this.apiKey,
          pageSize: this.newsCountLimit,
          language: 'en',
        },
      });
    } catch (error) {
      console.error('Error fetching news from external service');
      console.error(error);
      return;
    }
  }
}
