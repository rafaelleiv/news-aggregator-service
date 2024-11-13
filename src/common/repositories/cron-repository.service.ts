import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CronRepositoryPort } from '../ports/cron-repository.port';
import { JobState } from '../../../prisma/interfaces';

@Injectable()
export class CronRepositoryService implements CronRepositoryPort {
  private readonly logger = new Logger(CronRepositoryService.name);

  /**
   * Constructor for NewsRepositoryService.
   * @param prisma - The Prisma service for database operations.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves cron job data by its name.
   * @param cronJobName - The name of the cron job.
   * @returns The state of the cron job.
   */
  async getCronJobDataByName(cronJobName: string): Promise<JobState> {
    this.logger.debug(`Getting cron job data by name: ${cronJobName}`);
    try {
      return await this.prisma.jobState.findUnique({
        where: { name: cronJobName },
        include: { topic: true },
      });
    } catch (error) {
      this.logger.error(`Error getting cron job data by name: ${cronJobName}`);
      throw error;
    }
  }

  /**
   * Registers cron job data.
   * @param cronJobName - The name of the cron job.
   * @returns The state of the cron job.
   */
  async registerCronJobData(cronJobName: string): Promise<JobState> {
    this.logger.debug(`Registering cron job data for: ${cronJobName}`);
    try {
      const existingJobState = await this.getCronJobDataByName(cronJobName);
      if (existingJobState) return existingJobState;
      return this.prisma.jobState.create({
        data: {
          name: cronJobName,
          lastPublishedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`Error registering cron job data for: ${cronJobName}`);
      throw error;
    }
  }

  /**
   * Activates a cron job.
   * @param cronJobName - The name of the cron job.
   */
  async activateCronJob(cronJobName: string): Promise<void> {
    try {
      await this.prisma.jobState.update({
        where: { name: cronJobName },
        data: { isActive: true },
      });
    } catch (error) {
      this.logger.error(`Error activating cron job: ${cronJobName}`);
      throw error;
    }
  }

  /**
   * Deactivates a cron job.
   * @param cronJobName - The name of the cron job.
   */
  async deactivateCronJob(cronJobName: string): Promise<void> {
    try {
      await this.prisma.jobState.update({
        where: { name: cronJobName },
        data: { isActive: false },
      });
    } catch (error) {
      this.logger.error(`Error deactivating cron job: ${cronJobName}`);
      throw error;
    }
  }

  /**
   * Updates the specified fields of a cron job.
   * @param cronJobName - The name of the cron job.
   * @param updateData - An object containing the fields to update.
   */
  async updateCronJobDataByName(
    cronJobName: string,
    updateData: Partial<JobState>,
  ): Promise<void> {
    this.logger.debug(
      `Updating cron job data for: ${cronJobName} with ${JSON.stringify(updateData)}`,
    );
    try {
      await this.prisma.jobState.update({
        where: { name: cronJobName },
        data: {
          lastPublishedAt: updateData.lastPublishedAt,
          page: updateData.page,
          pageSize: updateData.pageSize,
          interval: updateData.interval,
          isActive: updateData.isActive,
          updatedAt: new Date(),
        },
      });
      this.logger.log(`Cron job ${cronJobName} updated successfully`);
    } catch (error) {
      this.logger.error(`Error updating cron job data for: ${cronJobName}`);
      throw error;
    }
  }
}
