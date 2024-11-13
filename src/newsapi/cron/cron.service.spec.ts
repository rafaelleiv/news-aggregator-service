import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CronRepositoryPort } from '../../common/ports/cron-repository.port';
import { NewsImporterPort } from '../../common/ports/news-importer.port';
import { CronJob } from 'cron';
import { UpdateCronJobDto } from '../../common/dto/update-cron-job.dto';

describe('CronService', () => {
  let service: CronService;
  let schedulerRegistry: SchedulerRegistry;
  let newsRepository: CronRepositoryPort;
  let newsApiService: NewsImporterPort;

  beforeEach(async () => {
    jest
      .spyOn(CronService.prototype as any, 'setupShutdownHooks')
      .mockImplementation(() => {}); // Mock setupShutdownHooks antes de la creación del módulo

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
            getCronJob: jest.fn(),
            deleteCronJob: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: CronRepositoryPort,
          useValue: {
            registerCronJobData: jest.fn(),
            getCronJobDataByName: jest
              .fn()
              .mockResolvedValue({ interval: '5m', isActive: true }),
            activateCronJob: jest.fn(),
            deactivateCronJob: jest.fn(),
            updateCronJobDataByName: jest.fn(),
          },
        },
        {
          provide: NewsImporterPort,
          useValue: { importNews: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    newsRepository = module.get<CronRepositoryPort>(CronRepositoryPort);
    newsApiService = module.get<NewsImporterPort>(NewsImporterPort);

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerAndStartCronJob', () => {
    it('should register and start the cron job successfully', async () => {
      jest.spyOn(service, 'startCron').mockImplementation(async () => {});

      await service['registerAndStartCronJob']();

      expect(newsRepository.registerCronJobData).toHaveBeenCalledWith(
        service['name'],
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Cron job ${service['name']} registered`,
      );
      expect(service.startCron).toHaveBeenCalled();
    });

    it('should log an error if registration fails', async () => {
      jest
        .spyOn(newsRepository, 'registerCronJobData')
        .mockRejectedValue(new Error('Registration error'));

      await service['registerAndStartCronJob']();

      expect(service['logger'].error).toHaveBeenCalledWith(
        `Error registering cron job ${service['name']}: Registration error`,
      );
    });
  });

  describe('startCron', () => {
    it('should start the cron job and log success', async () => {
      jest.spyOn(schedulerRegistry, 'addCronJob').mockImplementation(() => {});
      jest.spyOn(newsRepository, 'getCronJobDataByName').mockResolvedValue({
        name: 'test',
        isActive: true,
        interval: '5m',
        lastPublishedAt: new Date(),
        pageSize: 10,
        page: 1,
        id: 1,
        topicId: 1,
        updatedAt: new Date(),
      });

      await service.startCron();

      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
        service['name'],
        expect.any(CronJob),
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Started cron job'),
      );
    });
  });

  describe('stopCron', () => {
    it('should stop the cron job if it exists', async () => {
      const job = new CronJob('* * * * *', () => {});
      jest.spyOn(job, 'stop');
      jest.spyOn(schedulerRegistry, 'getCronJob').mockReturnValue(job);
      jest
        .spyOn(schedulerRegistry, 'deleteCronJob')
        .mockImplementation(() => {});
      jest
        .spyOn(newsRepository, 'deactivateCronJob')
        .mockResolvedValue(undefined);

      await service.stopCron();

      expect(job.stop).toHaveBeenCalled(); // Ahora Jest puede verificar la llamada
      expect(newsRepository.deactivateCronJob).toHaveBeenCalledWith(
        service['name'],
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Stopped cron job'),
      );
    });

    it('should log a warning if the cron job does not exist', async () => {
      jest.spyOn(schedulerRegistry, 'getCronJob').mockReturnValue(undefined);

      await service.stopCron();

      expect(service['logger'].warn).toHaveBeenCalledWith(
        expect.stringContaining('Cron job news-api-cron not found'),
      );
    });
  });

  describe('cronAction', () => {
    it('should perform cron action and log success', async () => {
      await service.cronAction();

      expect(newsApiService.importNews).toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('is running'),
      );
    });

    it('should log an error if cron action fails', async () => {
      jest
        .spyOn(newsApiService, 'importNews')
        .mockRejectedValue(new Error('Import error'));

      await expect(service.cronAction()).rejects.toThrow('Import error');
      expect(service['logger'].error).toHaveBeenCalledWith(
        expect.stringContaining('Error running cron job'),
      );
    });
  });

  describe('updateCronJobDataByName', () => {
    it('should update cron job data and log success', async () => {
      const updateData: UpdateCronJobDto = {
        interval: '10m',
        isActive: true,
        lastPublishedAt: null,
        pageSize: 10,
      };

      await service.updateCronJobDataByName(service['name'], updateData);

      expect(newsRepository.updateCronJobDataByName).toHaveBeenCalledWith(
        service['name'],
        updateData,
      );
    });

    it('should log an error if updating cron job data fails', async () => {
      jest
        .spyOn(newsRepository, 'updateCronJobDataByName')
        .mockRejectedValue(new Error('Update error'));

      await expect(
        service.updateCronJobDataByName(
          service['name'],
          {} as UpdateCronJobDto,
        ),
      ).rejects.toThrow('Update error');
      expect(service['logger'].error).toHaveBeenCalledWith(
        expect.stringContaining('Error updating cron job data'),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should stop the cron job on module destroy', async () => {
      jest.spyOn(service, 'stopCron').mockImplementation(async () => {});

      await service.onModuleDestroy();

      expect(service.stopCron).toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Shutting down ${service['name']} cron job on module destroy`,
        ),
      );
    });
  });

  describe('executeCronJob', () => {
    it('should execute cron job immediately', async () => {
      jest.spyOn(service, 'cronAction').mockImplementation(async () => {});

      await service.executeCronJob();

      expect(service.cronAction).toHaveBeenCalled();
    });
  });
});
