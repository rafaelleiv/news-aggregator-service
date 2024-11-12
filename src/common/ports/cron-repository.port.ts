import { JobState } from '@prisma/client';

export abstract class CronRepositoryPort {
  abstract registerCronJobData(cronJobName: string): Promise<JobState>;

  abstract getCronJobDataByName(cronJobName: string): Promise<JobState>;

  abstract updateCronJobData(cron: JobState): Promise<void>;

  abstract activateCronJob(cronJobName: string): Promise<void>;

  abstract deactivateCronJob(cronJobName: string): Promise<void>;

  abstract updateCronJobDataByName(
    cronJobName: string,
    cron: Partial<JobState>,
  ): Promise<void>;
}
