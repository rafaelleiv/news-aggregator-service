import { Test, TestingModule } from '@nestjs/testing';
import { NewsApiController } from './newsApiController';
import { CronServicePort } from '../common/ports/cron-service.port';
import { UpdateCronJobDto } from '../common/dto/update-cron-job.dto';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

describe('NewsApiController', () => {
  let controller: NewsApiController;
  let cronService: CronServicePort;
  let res: Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsApiController],
      providers: [
        {
          provide: CronServicePort,
          useValue: {
            startCron: jest.fn(),
            stopCron: jest.fn(),
            updateCronJobDataByName: jest.fn(),
            executeCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NewsApiController>(NewsApiController);
    cronService = module.get<CronServicePort>(CronServicePort);

    // Mock de métodos `log` y `error` de Logger para evitar mensajes en la consola
    jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restaurar todos los mocks al finalizar las pruebas
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startCron', () => {
    it('should start the cron job and return success message', async () => {
      await controller.startCron(res);
      expect(cronService.startCron).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cron job started successfully',
      });
    });

    it('should handle errors when starting the cron job', async () => {
      jest.spyOn(cronService, 'startCron').mockImplementation(() => {
        throw new Error('Failed to start cron job');
      });

      await controller.startCron(res);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to start cron job',
        error: 'Failed to start cron job',
      });
    });
  });

  describe('stopCron', () => {
    it('should stop the cron job and return success message', async () => {
      await controller.stopCron(res);
      expect(cronService.stopCron).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cron job stopped successfully',
      });
    });

    it('should handle errors when stopping the cron job', async () => {
      jest.spyOn(cronService, 'stopCron').mockImplementation(() => {
        throw new Error('Failed to stop cron job');
      });

      await controller.stopCron(res);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to pause cron job',
        error: 'Failed to stop cron job',
      });
    });
  });

  describe('updateCronJob', () => {
    it('should update the cron job and return success message', async () => {
      const cronJobName = 'test-job';
      const updateData: UpdateCronJobDto = { interval: '5m' };

      await controller.updateCronJob(cronJobName, updateData, res);
      expect(cronService.updateCronJobDataByName).toHaveBeenCalledWith(
        cronJobName,
        updateData,
      );
    });

    it('should handle errors when updating the cron job', async () => {
      const cronJobName = 'test-job';
      const updateData: UpdateCronJobDto = { interval: '5m' };

      jest
        .spyOn(cronService, 'updateCronJobDataByName')
        .mockImplementation(() => {
          return Promise.reject(new Error('Failed to update cron job'));
        });

      await controller.updateCronJob(cronJobName, updateData, res);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to update cron job',
        error: 'Failed to update cron job',
      });
    });
  });

  describe('executeCronJob', () => {
    it('should execute the cron job and return success message', async () => {
      const cronJobName = 'test-job';

      await controller.executeCronJob(cronJobName, res);
      expect(cronService.executeCronJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cron job executed successfully',
      });
    });

    it('should handle errors when executing the cron job', async () => {
      const cronJobName = 'test-job';

      jest.spyOn(cronService, 'executeCronJob').mockImplementation(() => {
        throw new Error('Failed to execute cron job');
      });

      await controller.executeCronJob(cronJobName, res);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to execute cron job',
        error: 'Failed to execute cron job',
      });
    });
  });
});
