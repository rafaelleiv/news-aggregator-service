import { Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CronService } from './cron/cron.service';
import { IServicesController } from '../common/interfaces/services-controller.interface';

@ApiTags('News API Cron Jobs')
@Controller('newsapi')
export class NewsApiController implements IServicesController {
  private readonly logger = new Logger(NewsApiController.name);

  constructor(private readonly cronService: CronService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the cron job for fetching news' })
  @ApiResponse({ status: 200, description: 'Cron job started successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async startCron(@Res() res: Response) {
    try {
      this.cronService.startCron();
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

  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause the cron job for fetching news' })
  @ApiResponse({ status: 200, description: 'Cron job paused successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async pauseCron(@Res() res: Response) {
    try {
      this.cronService.stopCron();
      this.logger.log('Cron job paused successfully');
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Cron job paused successfully' });
    } catch (error) {
      this.logger.error('Failed to pause cron job', error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to pause cron job',
        error: error.message,
      });
    }
  }
}
