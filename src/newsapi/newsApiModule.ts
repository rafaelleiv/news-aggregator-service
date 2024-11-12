import { Module } from '@nestjs/common';
import { NewsApiService } from './news-api.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { ConfigService } from '@nestjs/config';
import { CronService } from './cron/cron.service';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NewsRepositoryService } from '../common/news-repository/news-repository.service';
import { NewsApiController } from './newsApiController';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    CronService,
    NewsApiService,
    PrismaService,
    WebsocketsGateway,
    ConfigService,
    SchedulerRegistry,
    NewsRepositoryService,
  ],
  controllers: [NewsApiController],
})
export class NewsApiModule {}
