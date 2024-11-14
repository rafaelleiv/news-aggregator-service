import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronServicePort } from '../../common/ports/cron-service.port';
import { NewsImporterPort } from '../../common/ports/news-importer.port';
import { CronRepositoryPort } from '../../common/ports/cron-repository.port';
import { convertIntervalToCronScheduleValue } from '../../common/utils';
import { UpdateCronJobDto } from '../../common/dto/update-cron-job.dto';

@Injectable()
export class CronService implements CronServicePort, OnModuleDestroy {
  private readonly name = 'news-api-cron';
  private readonly logger = new Logger(CronService.name);
  private cronScheduleValue: string;

  constructor(
    private readonly newsApiService: NewsImporterPort,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly newsRepository: CronRepositoryPort,
  ) {
    this.cronScheduleValue = '*/10 * * * *'; // Default interval of 10 minutes
    this.registerAndStartCronJob().then();
    this.setupShutdownHooks();
  }

  /**
   * Registers and starts the cron job with a dynamic interval.
   */
  private async registerAndStartCronJob(): Promise<void> {
    try {
      await this.newsRepository.registerCronJobData(this.name);
      this.logger.log(`Cron job ${this.name} registered`);
      await this.startCron();
    } catch (error) {
      this.logger.error(
        `Error registering cron job ${this.name}: ${error.message}`,
      );
    }
  }

  /**
   * Starts the cron job and sets up the dynamic interval from the database.
   */
  async startCron(): Promise<void> {
    const cronData = await this.newsRepository.getCronJobDataByName(this.name);
    this.cronScheduleValue =
      convertIntervalToCronScheduleValue(cronData.interval) ||
      this.cronScheduleValue;
    const job = new CronJob(this.cronScheduleValue, () => this.cronAction());

    // Store and start the job
    this.schedulerRegistry.addCronJob(this.name, job);
    job.start();
    this.logger.log(
      `Cron job ${this.name} started with interval ${this.cronScheduleValue}`,
    );

    await this.newsRepository.activateCronJob(this.name);
  }

  /**
   * Stops the cron job.
   */
  async stopCron(): Promise<void> {
    const job = this.schedulerRegistry.getCronJob(this.name);
    if (job) {
      job.stop();
      this.logger.log(`Cron job ${this.name} stopped`);
      await this.newsRepository.deactivateCronJob(this.name);
      this.schedulerRegistry.deleteCronJob(this.name);
    } else {
      this.logger.warn(`Cron job ${this.name} not found`);
    }
  }

  /**
   * Action executed by the cron job; checks and updates the dynamic interval.
   */
  async cronAction(): Promise<void> {
    const cronData = await this.newsRepository.getCronJobDataByName(this.name);
    const newCronScheduleValue =
      convertIntervalToCronScheduleValue(cronData.interval) ||
      this.cronScheduleValue;

    // Check if the interval has changed and restart the cron job if necessary
    if (newCronScheduleValue !== this.cronScheduleValue) {
      this.logger.log(
        `Detected new interval for ${this.name}. Restarting with interval ${newCronScheduleValue}`,
      );
      await this.stopCron(); // Stop the current cron job
      this.cronScheduleValue = newCronScheduleValue;
      await this.startCron(); // Restart a cron job with a new interval

      // Execute the cron job action immediately after rescheduling
      await this.newsApiService.importNews(cronData);
      this.logger.log(
        `Executed cron job ${this.name} immediately after rescheduling.`,
      );
      return; // Exit current execution after immediate run
    }

    this.logger.log(`Cron job ${this.name} running at ${new Date()}`);
    try {
      await this.newsApiService.importNews(cronData);
    } catch (error) {
      this.logger.error(
        `Error running cron job ${this.name}: ${error.message}`,
      );
      throw error;
    }
    this.logger.log(
      `Cron job ${this.name} completed at ${new Date()}. Next run in ${cronData.interval}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Shutting down cron job ${this.name} on module destroy`);
    await this.stopCron();
  }

  private setupShutdownHooks(): void {
    process.on('SIGINT', async () => {
      this.logger.log('Received SIGINT. Shutting down gracefully...');
      await this.stopCron();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.log('Received SIGTERM. Shutting down gracefully...');
      await this.stopCron();
      process.exit(0);
    });
  }

  async updateCronJobDataByName(
    cronJobName: string,
    updateData: UpdateCronJobDto,
  ): Promise<void> {
    try {
      await this.newsRepository.updateCronJobDataByName(cronJobName, {
        interval: updateData.interval,
        isActive: updateData.isActive,
        lastPublishedAt: updateData.lastPublishedAt,
        pageSize: updateData.pageSize,
      });
    } catch (error) {
      this.logger.error(
        `Error updating cron job data for ${cronJobName}: ${error.message}`,
      );
      throw error;
    }
  }

  async executeCronJob(): Promise<void> {
    await this.cronAction();
  }
}
