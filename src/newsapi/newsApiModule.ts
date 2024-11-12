import { Module } from '@nestjs/common';
import { NewsApiService } from './news-api.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { ConfigService } from '@nestjs/config';
import { CronService } from './cron/cron.service';
import { SchedulerRegistry } from '@nestjs/schedule';

@Module({
  providers: [
    CronService,
    NewsApiService,
    PrismaService,
    WebsocketsGateway,
    ConfigService,
    SchedulerRegistry,
  ],
})
export class NewsApiModule {}
