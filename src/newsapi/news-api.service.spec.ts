import { Test, TestingModule } from '@nestjs/testing';
import { NewsApiService } from './news-api.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { ConfigService } from '@nestjs/config';
import { CronRepositoryPort } from '../common/ports/cron-repository.port';
import { ArticleRepositoryPort } from '../common/ports/article-repository.port';
import { Article, JobState } from '@prisma/client';
import { Topic } from '../../prisma/interfaces';
import axios from 'axios';

describe('NewsApiService', () => {
  let service: NewsApiService;
  let configService: ConfigService;
  let articleRepository: ArticleRepositoryPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsApiService,
        {
          provide: WebsocketsGateway,
          useValue: { sendNewsToTopic: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NEWS_API_URL')
                return 'https://newsapi.org/v2/top-headlines';
              if (key === 'NEWS_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: CronRepositoryPort,
          useValue: { updateCronJobDataByName: jest.fn() },
        },
        {
          provide: ArticleRepositoryPort,
          useValue: { saveArticles: jest.fn(), getTopics: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NewsApiService>(NewsApiService);
    configService = module.get<ConfigService>(ConfigService);
    articleRepository = module.get<ArticleRepositoryPort>(
      ArticleRepositoryPort,
    );

    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'NEWS_API_URL') return 'https://newsapi.org/v2/top-headlines';
      if (key === 'NEWS_API_KEY') return 'test-api-key';
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize topic queue', async () => {
    const mockTopics: Topic[] = [{ id: 1, name: 'general' }];
    jest.spyOn(articleRepository, 'getTopics').mockResolvedValue(mockTopics);

    await service['initializeTopicQueue']();

    expect(service['topicsQueue']).toEqual(mockTopics);
  });

  it('should fall back to default topic if queue is empty', async () => {
    jest.spyOn(articleRepository, 'getTopics').mockResolvedValue([]);

    await service['initializeTopicQueue']();

    expect(service['topicsQueue']).toEqual([{ id: 1, name: 'general' }]);
  });

  it('should validate incoming data correctly', () => {
    const validData = {
      title: 'Test Article',
      description: 'Test Description',
      url: 'http://test.com',
      urlToImage: 'http://test.com/image.jpg',
      publishedAt: '2023-01-01T00:00:00Z',
      source: { name: 'Test Source' },
      author: 'Test Author',
    };

    const invalidData = {
      title: '',
      description: '',
      url: '',
      urlToImage: '',
      publishedAt: '',
      source: { name: '' },
      author: '',
    };

    expect(service.validateIncomingData(validData)).toBe(true);
    expect(service.validateIncomingData(invalidData)).toBe(false);
  });

  it('should fetch news from external service', async () => {
    const mockAxiosResponse = { data: { status: 'ok', articles: [] } };
    jest.spyOn(axios, 'get').mockResolvedValue(mockAxiosResponse);

    const cron: JobState = {
      name: 'test-job',
      page: 1,
      pageSize: 10,
    } as JobState;
    const response = await service['fetchNewsFromExternalService'](
      cron,
      'general',
    );

    expect(response).toEqual(mockAxiosResponse);
  });

  it('should handle empty articles from external service', async () => {
    const cron: JobState = {
      name: 'test-job',
      page: 1,
      pageSize: 10,
    } as JobState;
    jest
      .spyOn(service as any, 'fetchNewsFromExternalService')
      .mockResolvedValue({
        data: { status: 'ok', articles: [] },
      });

    // Mock `initializeTopicQueue` to ensure topicsQueue has at least one topic
    jest
      .spyOn(service as any, 'initializeTopicQueue')
      .mockImplementation(async () => {
        service['topicsQueue'] = [
          {
            id: 1,
            name: 'general',
          },
        ]; // Mock data for topicsQueue
      });

    // Call the mocked `initializeTopicQueue` to populate topicsQueue
    await service['initializeTopicQueue']();

    const loggerSpy = jest.spyOn(service['logger'], 'log');
    await service.importNews(cron);

    expect(loggerSpy).toHaveBeenCalledWith(
      'No articles returned from external service.',
    );
  });

  it('should save incoming articles', async () => {
    const mockArticles = [
      {
        title: 'Test Article',
        description: 'Test Description',
        url: 'http://test.com',
        urlToImage: 'http://test.com/image.jpg',
        publishedAt: '2023-01-01T00:00:00Z',
        source: { name: 'Test Source' },
        author: 'Test Author',
      },
    ];
    jest
      .spyOn(articleRepository, 'saveArticles')
      .mockResolvedValue([{ id: 1 } as Article]);

    const topic: Topic = { id: 1, name: 'test-topic' };
    const savedArticles = await service['saveIncomingArticles'](
      mockArticles,
      topic,
    );

    expect(savedArticles).toEqual([{ id: 1 }]);
  });
});
