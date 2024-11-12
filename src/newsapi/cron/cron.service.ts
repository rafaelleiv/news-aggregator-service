import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { convertIntervalToCronScheduleValue } from '../../common/utils';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';
import { CronServicePort } from '../../common/ports/cron.port';
import { NewsImporterPort } from '../../common/ports/news-importer.port';
import { NewsRepositoryPort } from '../../common/ports/news-repository.port';

@Injectable()
export class CronService implements CronServicePort {
  private readonly name = 'news-api-cron';
  private readonly logger = new Logger(CronService.name);
  private readonly cronScheduleValue = convertIntervalToCronScheduleValue(
    this.configService.get<string>('NEWS_API_CRON_INTERVAL') || '10m',
  );

  constructor(
    private readonly newsApiService: NewsImporterPort,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly newsRepository: NewsRepositoryPort,
  ) {
    this.startCron();
  }

  removeCron(): void {
    try {
      this.schedulerRegistry.deleteCronJob(this.name);
      this.logger.log(`Removed cron job ${this.name}`);
    } catch (error) {
      this.logger.warn(`Cron job ${this.name} not found, cannot remove`);
      this.logger.error(error.message);
    }
  }

  startCron(): void {
    const job = new CronJob(this.cronScheduleValue, async () => {
      this.logger.log(`Cron job ${this.name} is running...`);
      try {
        const lastPublishedNews = await this.getLastPublishedNewsByCronJob();
        await this.newsApiService.importNews(this.name, lastPublishedNews);
      } catch (error) {
        this.logger.error(
          `Error running cron job ${this.name}: ${error.message}`,
        );
      }
    });

    this.schedulerRegistry.addCronJob(this.name, job);
    job.start();
    this.logger.log(
      `Started cron job ${this.name} with interval ${this.cronScheduleValue}`,
    );
  }

  stopCron(): void {
    const job = this.schedulerRegistry.getCronJob(this.name);
    if (job) {
      job.stop();
      this.logger.log(`Stopped cron job ${this.name}`);
    } else {
      this.logger.warn(`Cron job ${this.name} not found`);
    }
  }

  private async getLastPublishedNewsByCronJob(): Promise<any> {
    return (
      (await this.newsRepository.getLastPublishedNewsByCronJob(this.name)) ||
      null
    );
  }
}
