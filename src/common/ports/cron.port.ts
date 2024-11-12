import { JobState } from '../../../prisma/interfaces';

export abstract class CronServicePort {
  abstract startCron(): void;
  abstract stopCron(): void;
  abstract cronAction(cron: JobState): Promise<void>;
}
