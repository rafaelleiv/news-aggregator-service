import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { CronServicePort } from '../src/common/ports/cron-service.port';
import { NewsApiController } from '../src/newsapi/newsApiController';
import { UpdateCronJobDto } from '../src/common/dto/update-cron-job.dto';

jest.setTimeout(20000); // Aumenta el tiempo de espera para todas las pruebas

describe('NewsApiController (e2e)', () => {
  let app: INestApplication;
  let cronService: CronServicePort;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NewsApiController],
      providers: [
        {
          provide: CronServicePort,
          useValue: {
            startCron: jest.fn(() => Promise.resolve()),
            stopCron: jest.fn(() => Promise.resolve()),
            updateCronJobDataByName: jest.fn(() => Promise.resolve()),
            executeCronJob: jest.fn(() => Promise.resolve()),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    cronService = moduleFixture.get<CronServicePort>(CronServicePort);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe('/newsapi/start (POST)', () => {
    it('should start the cron job successfully', () => {
      return request(app.getHttpServer())
        .post('/newsapi/start')
        .expect(HttpStatus.OK)
        .expect({ message: 'Cron job started successfully' });
    });

    it('should handle errors when starting the cron job', () => {
      jest.spyOn(cronService, 'startCron').mockImplementation(() => {
        throw new Error('Failed to start cron job');
      });

      return request(app.getHttpServer())
        .post('/newsapi/start')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          expect(res.body.message).toBe('Failed to start cron job');
        });
    });
  });

  describe('/newsapi/stop (POST)', () => {
    it('should stop the cron job successfully', () => {
      return request(app.getHttpServer())
        .post('/newsapi/stop')
        .expect(HttpStatus.OK)
        .expect({ message: 'Cron job stopped successfully' });
    });

    it('should handle errors when stopping the cron job', () => {
      jest.spyOn(cronService, 'stopCron').mockImplementation(() => {
        throw new Error('Failed to stop cron job');
      });

      return request(app.getHttpServer())
        .post('/newsapi/stop')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          expect(res.body.message).toBe('Failed to pause cron job');
        });
    });
  });

  describe('/newsapi/:cronJobName (PATCH)', () => {
    it('should update the cron job successfully', () => {
      jest
        .spyOn(cronService, 'updateCronJobDataByName')
        .mockImplementation(() => {
          return Promise.resolve();
        });

      const updateData: UpdateCronJobDto = {
        interval: '10m',
        isActive: true,
        lastPublishedAt: new Date(),
        pageSize: 20,
      };

      return request(app.getHttpServer())
        .patch('/newsapi/test-job')
        .send(updateData)
        .expect(HttpStatus.OK)
        .expect({ message: 'Cron job updated successfully' });
    });
    it('should handle errors when updating the cron job', () => {
      jest
        .spyOn(cronService, 'updateCronJobDataByName')
        .mockImplementation(() => {
          return Promise.reject('Failed to update cron job');
        });

      const updateData: UpdateCronJobDto = {
        interval: '10m',
        isActive: true,
        lastPublishedAt: new Date(),
        pageSize: 20,
      };

      return request(app.getHttpServer())
        .patch('/newsapi/test-job')
        .send(updateData)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          expect(res.body.message).toBe('Failed to update cron job');
        });
    });
  });

  describe('/newsapi/execute (POST)', () => {
    it('should execute the cron job successfully', () => {
      return request(app.getHttpServer())
        .post('/newsapi/execute')
        .expect(HttpStatus.OK)
        .expect({ message: 'Cron job executed successfully' });
    });

    it('should handle errors when executing the cron job', () => {
      jest.spyOn(cronService, 'executeCronJob').mockImplementation(() => {
        throw new Error('Failed to execute cron job');
      });

      return request(app.getHttpServer())
        .post('/newsapi/execute')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          expect(res.body.message).toBe('Failed to execute cron job');
        });
    });
  });
});
