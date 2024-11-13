import { JobState } from '../../../prisma/interfaces';
import { UpdateCronJobDto } from '../dto/update-cron-job.dto';

export abstract class CronServicePort {
  abstract startCron(): Promise<void>;
  abstract stopCron(): Promise<void>;
  abstract cronAction(cron: JobState): Promise<void>;

  abstract updateCronJobDataByName(
    cronJobName: string,
    updateData: UpdateCronJobDto,
  ): Promise<void>;

  abstract executeCronJob(): Promise<void>;
}
