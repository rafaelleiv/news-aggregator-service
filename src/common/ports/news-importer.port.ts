import { JobState } from '@prisma/client';

export abstract class NewsImporterPort {
  abstract importNews(cron: JobState, topics?: string[]): Promise<void>;
  abstract sendNotification(newsData: any): void;
}
