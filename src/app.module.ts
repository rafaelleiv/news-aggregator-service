import { Module } from '@nestjs/common';
import { NewsApiModule } from './newsapi/newsApiModule';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [NewsApiModule, PrismaModule, WebsocketsModule],
})
export class AppModule {}
