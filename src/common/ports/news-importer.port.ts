import { JobState } from '@prisma/client';

export abstract class NewsImporterPort {
  abstract importNews(cron: JobState): Promise<void>;
  abstract sendNotification(newsData: any): void;
}
