import { Module } from '@nestjs/common';
import { NewsApiService } from './news-api.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { ConfigService } from '@nestjs/config';
import { CronService } from './cron/cron.service';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NewsRepositoryService } from '../common/news-repository/news-repository.service';
import { NewsApiController } from './newsApiController';
import { CronServicePort } from '../common/ports/cron.port';
import { NewsImporterPort } from '../common/ports/news-importer.port';
import { NewsRepositoryPort } from '../common/ports/news-repository.port';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    { provide: CronServicePort, useClass: CronService },
    { provide: NewsImporterPort, useClass: NewsApiService },
    PrismaService,
    WebsocketsGateway,
    ConfigService,
    SchedulerRegistry,
    { provide: NewsRepositoryPort, useClass: NewsRepositoryService },
  ],
  controllers: [NewsApiController],
})
export class NewsApiModule {}
