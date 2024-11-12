import { Article, JobState, State, Topic } from '@prisma/client';

export abstract class NewsRepositoryPort {
  abstract registerCronJobData(cronJobName: string): Promise<JobState>;

  abstract getCronJobDataByName(cronJobName: string): Promise<JobState>;

  abstract updateCronJobData(cron: JobState): Promise<void>;

  abstract activateCronJob(cronJobName: string): Promise<void>;

  abstract deactivateCronJob(cronJobName: string): Promise<void>;

  abstract saveArticles(articles: Article[]): Promise<void>;

  abstract getTopics(): Promise<Topic[]>;

  abstract getStates(): Promise<State[]>;
}
