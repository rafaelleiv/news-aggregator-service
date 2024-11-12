import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsApiModule } from './newsapi/newsApiModule';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [NewsApiModule, PrismaModule, WebsocketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
