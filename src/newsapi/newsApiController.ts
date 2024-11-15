import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ControllerPort } from '../common/ports/services-controller.port';
import { CronServicePort } from '../common/ports/cron-service.port';
import { UpdateCronJobDto } from '../common/dto/update-cron-job.dto';

@ApiTags('News API Cron Jobs')
@Controller('newsapi')
export class NewsApiController implements ControllerPort {
  private readonly logger = new Logger(NewsApiController.name);

  constructor(private readonly cronService: CronServicePort) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the cron job for fetching news' })
  @ApiResponse({ status: 200, description: 'Cron job started successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async startCron(@Res() res: Response) {
    try {
      await this.cronService.startCron();
      this.logger.log('Cron job started successfully');
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Cron job started successfully' });
    } catch (error) {
      this.logger.error('Failed to start cron job', error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to start cron job',
        error: error.message,
      });
    }
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the cron job for fetching news' })
  @ApiResponse({ status: 200, description: 'Cron job stopped successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async stopCron(@Res() res: Response) {
    try {
      await this.cronService.stopCron();
      this.logger.log('Cron job stopped successfully');
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Cron job stopped successfully' });
    } catch (error) {
      this.logger.error('Failed to stopped cron job', error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to pause cron job',
        error: error.message,
      });
    }
  }

  @Patch(':cronJobName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update specified cron job attributes' })
  @ApiResponse({ status: 200, description: 'Cron job updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateCronJob(
    @Param('cronJobName') cronJobName: string,
    @Body() updateData: UpdateCronJobDto,
    @Res() res: Response,
  ) {
    try {
      await this.cronService.updateCronJobDataByName(cronJobName, updateData);
      this.logger.log(`Cron job ${cronJobName} updated successfully`);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Cron job updated successfully' });
    } catch (error) {
      this.logger.error(`Failed to update cron job`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update cron job',
        error: error.message,
      });
    }
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute the cron job immediately' })
  @ApiResponse({ status: 200, description: 'Cron job executed successfully' })
  async executeCronJob(
    @Param('cronJobName') cronJobName: string,
    @Res() res: Response,
  ) {
    try {
      await this.cronService.executeCronJob();
      this.logger.log(`Cron job ${cronJobName} executed successfully`);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Cron job executed successfully' });
    } catch (error) {
      this.logger.error(`Failed to execute cron job: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to execute cron job',
        error: error.message,
      });
    }
  }
}
