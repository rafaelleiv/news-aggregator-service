import { Module } from '@nestjs/common';
import { NewsApiService } from './news-api.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { ConfigService } from '@nestjs/config';
import { CronService } from './cron/cron.service';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NewsApiController } from './newsApiController';
import { CronServicePort } from '../common/ports/cron-service.port';
import { NewsImporterPort } from '../common/ports/news-importer.port';
import { CronRepositoryPort } from '../common/ports/cron-repository.port';
import { CronRepositoryService } from '../common/repositories/cron-repository.service';
import { ArticleRepositoryPort } from '../common/ports/article-repository.port';
import { ArticleRepositoryService } from '../common/repositories/article-repository.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    { provide: CronServicePort, useClass: CronService },
    { provide: NewsImporterPort, useClass: NewsApiService },
    PrismaService,
    WebsocketsGateway,
    ConfigService,
    SchedulerRegistry,
    { provide: CronRepositoryPort, useClass: CronRepositoryService },
    {
      provide: ArticleRepositoryPort,
      useClass: ArticleRepositoryService,
    },
  ],
  controllers: [NewsApiController],
})
export class NewsApiModule {}
