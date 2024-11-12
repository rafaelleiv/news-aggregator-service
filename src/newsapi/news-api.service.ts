import { Injectable, Logger } from '@nestjs/common';
import { INewsImporter } from '../common/interfaces/news-importer.interface';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import axios from 'axios';
import { Article } from '@prisma/client';
import * as console from 'node:console';
import { ConfigService } from '@nestjs/config';
import { buildQuery } from '../common/utils';

@Injectable()
export class NewsApiService implements INewsImporter {
  private readonly logger = new Logger(NewsApiService.name);
  private readonly newsApiUrl = this.configService.get<string>('NEWS_API_URL');
  private readonly daysAgo =
    this.configService.get<number>('NEWS_API_DAYS_AGO') || 3;
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
  ) {
    if (!this.newsApiUrl) {
      throw new Error('NEWS_API_URL is not defined in environment variables');
    }
    if (!this.apiKey) {
      throw new Error('NEWS_API_KEY is not defined in environment variables');
    }
  }

  async importNews(): Promise<void> {
    const apiResponse = await this.fetchNewsFromExternalService();
    const newsData = apiResponse.data;
    console.log('News data', newsData);
    // for (const news of newsData) {
    //   // await this.prisma.article.create({
    //   //   data: {
    //   //     title: news.title,
    //   //     slug: slugify(news.title, { lower: true, strict: true }),
    //   //     summary: news.summary,
    //   //     topics: { connect: news.topics.map((id: any) => ({ id })) },
    //   //     states: { connect: news.states.map((id: any) => ({ id })) },
    //   //     image: news.image,
    //   //     link: news.link,
    //   //     views: 0,
    //   //     authorName: news.author,
    //   //     publishedAt: news.date,
    //   //   },
    //   // });
    // }

    // Send notification to clients
    this.sendNotification(newsData);
  }

  async detectTopics(): Promise<{ topics: string[] }> {
    throw new Error('Method not implemented.');
  }

  async detectStates(): Promise<{ states: string[] }> {
    throw new Error('Method not implemented.');
  }

  sendNotification(article: Article): void {
    console.log('Sending notification to clients', article);
    throw new Error('Method not implemented.');
  }

  private async fetchNewsFromExternalService() {
    const newArticlesDateLimit = new Date(
      Date.now() - this.daysAgo * 24 * 60 * 60 * 1000,
    );

    const q = buildQuery(this.topics.split(','));

    try {
      const newsData = await axios.get(this.newsApiUrl, {
        params: {
          q,
          from: newArticlesDateLimit.toISOString(),
          to: new Date().toISOString(),
          sortBy: 'popularity',
          apiKey: this.apiKey,
          pageSize: this.newsCountLimit,
          language: 'en',
        },
      });
      return newsData;
    } catch (error) {
      console.error('Error fetching news from external service');
      console.error(error);
      return;
    }
  }
}
