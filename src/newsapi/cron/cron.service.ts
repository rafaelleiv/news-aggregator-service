import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';
import { CronServicePort } from '../../common/ports/cron-service.port';
import { NewsImporterPort } from '../../common/ports/news-importer.port';
import { CronRepositoryPort } from '../../common/ports/cron-repository.port';
import { JobState } from '../../../prisma/interfaces';
import { convertIntervalToCronScheduleValue } from '../../common/utils';
import * as process from 'node:process';
import { UpdateCronJobDto } from '../../common/dto/update-cron-job.dto';

@Injectable()
export class CronService implements CronServicePort, OnModuleDestroy {
  private readonly name = 'news-api-cron';
  private readonly logger = new Logger(CronService.name);

  /**
   * Constructor for CronService.
   * @param newsApiService - The service responsible for importing news.
   * @param schedulerRegistry - The registry for managing scheduled jobs.
   * @param configService - The service for accessing configuration variables.
   * @param newsRepository - The repository for managing news data.
   */
  constructor(
    private readonly newsApiService: NewsImporterPort,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly newsRepository: CronRepositoryPort,
  ) {
    this.registerAndStartCronJob().then();
    this.setupShutdownHooks();
  }

  /**
   * Registers and starts the cron job.
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
   * Starts the cron job.
   */
  async startCron(): Promise<void> {
    const cron = await this.newsRepository.getCronJobDataByName(this.name);
    const cronScheduleValue = convertIntervalToCronScheduleValue(cron.interval);
    const job = new CronJob(cronScheduleValue, () => this.cronAction(cron));
    this.schedulerRegistry.addCronJob(this.name, job);
    job.start();
    this.logger.log(
      `Started cron job ${this.name} with interval ${cronScheduleValue}`,
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
      this.logger.log(`Stopped cron job ${this.name}`);
      await this.newsRepository.deactivateCronJob(this.name);
      this.schedulerRegistry.deleteCronJob(this.name);
    } else {
      this.logger.warn(`Cron job ${this.name} not found`);
    }
  }

  /**
   * Action to be performed by the cron job.
   * @param cron - The state of the cron job.
   */
  async cronAction(cron: JobState): Promise<void> {
    this.logger.log(`Cron job ${this.name} is running...`);
    try {
      await this.newsApiService.importNews(cron);
    } catch (error) {
      this.logger.error(
        `Error running cron job ${this.name}: ${error.message}`,
      );
    }
  }

  /**
   * Handles module destruction by stopping the cron job.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Shutting down ${this.name} cron job on module destroy`);
    await this.stopCron();
  }

  /**
   * Sets up shutdown hooks to stop the cron job gracefully.
   */
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
}
