import { Module } from '@nestjs/common';
import { NewsApiModule } from './newsapi/newsApiModule';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { NewsRepositoryService } from './common/news-repository/news-repository.service';

@Module({
  imports: [NewsApiModule, PrismaModule, WebsocketsModule],
  controllers: [],
  providers: [NewsRepositoryService],
})
export class AppModule {}
