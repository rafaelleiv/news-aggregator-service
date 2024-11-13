import { Test, TestingModule } from '@nestjs/testing';
import { CronRepositoryService } from './cron-repository.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobState } from '../../../prisma/interfaces';

describe('CronRepositoryService', () => {
  let service: CronRepositoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronRepositoryService,
        {
          provide: PrismaService,
          useValue: {
            jobState: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CronRepositoryService>(CronRepositoryService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.spyOn(service['logger'], 'debug').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCronJobDataByName', () => {
    it('should retrieve cron job data by name', async () => {
      const jobState = { name: 'test-cron', topic: {} } as JobState;
      jest.spyOn(prisma.jobState, 'findUnique').mockResolvedValue(jobState);

      const result = await service.getCronJobDataByName('test-cron');

      expect(prisma.jobState.findUnique).toHaveBeenCalledWith({
        where: { name: 'test-cron' },
        include: { topic: true },
      });
      expect(result).toEqual(jobState);
    });

    it('should log and throw an error if retrieval fails', async () => {
      jest
        .spyOn(prisma.jobState, 'findUnique')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.getCronJobDataByName('test-cron')).rejects.toThrow(
        'Database error',
      );
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error getting cron job data by name: test-cron',
      );
    });
  });

  describe('registerCronJobData', () => {
    it('should register a new cron job if it does not exist', async () => {
      jest.spyOn(service, 'getCronJobDataByName').mockResolvedValue(null);
      const jobState = {
        name: 'test',
        isActive: true,
        interval: '5m',
        lastPublishedAt: new Date(),
        pageSize: 10,
        page: 1,
        id: 1,
        topicId: 1,
        updatedAt: new Date(),
      } as JobState;
      jest.spyOn(prisma.jobState, 'create').mockResolvedValue(jobState);

      const result = await service.registerCronJobData('test-cron');

      expect(prisma.jobState.create).toHaveBeenCalledWith({
        data: {
          name: 'test-cron',
          lastPublishedAt: expect.any(String),
        },
      });
      expect(result).toEqual(jobState);
    });

    it('should return existing cron job if it already exists', async () => {
      const existingJobState = { name: 'test-cron' } as JobState;
      jest
        .spyOn(service, 'getCronJobDataByName')
        .mockResolvedValue(existingJobState);

      const result = await service.registerCronJobData('test-cron');

      expect(prisma.jobState.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingJobState);
    });

    it('should log and throw an error if registration fails', async () => {
      jest
        .spyOn(service, 'getCronJobDataByName')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.registerCronJobData('test-cron')).rejects.toThrow(
        'Database error',
      );
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error registering cron job data for: test-cron',
      );
    });
  });

  describe('activateCronJob', () => {
    it('should activate a cron job', async () => {
      jest.spyOn(prisma.jobState, 'update').mockResolvedValue(undefined);

      await service.activateCronJob('test-cron');

      expect(prisma.jobState.update).toHaveBeenCalledWith({
        where: { name: 'test-cron' },
        data: { isActive: true },
      });
    });

    it('should log and throw an error if activation fails', async () => {
      jest
        .spyOn(prisma.jobState, 'update')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.activateCronJob('test-cron')).rejects.toThrow(
        'Database error',
      );
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error activating cron job: test-cron',
      );
    });
  });

  describe('deactivateCronJob', () => {
    it('should deactivate a cron job', async () => {
      jest.spyOn(prisma.jobState, 'update').mockResolvedValue(undefined);

      await service.deactivateCronJob('test-cron');

      expect(prisma.jobState.update).toHaveBeenCalledWith({
        where: { name: 'test-cron' },
        data: { isActive: false },
      });
    });

    it('should log and throw an error if deactivation fails', async () => {
      jest
        .spyOn(prisma.jobState, 'update')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.deactivateCronJob('test-cron')).rejects.toThrow(
        'Database error',
      );
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error deactivating cron job: test-cron',
      );
    });
  });

  describe('updateCronJobDataByName', () => {
    it('should update cron job data with specified fields', async () => {
      const updateData = {
        lastPublishedAt: new Date(),
        page: 2,
        pageSize: 20,
        interval: '10m',
        isActive: true,
      };

      jest.spyOn(prisma.jobState, 'update').mockResolvedValue(undefined);

      await service.updateCronJobDataByName('test-cron', updateData);

      expect(prisma.jobState.update).toHaveBeenCalledWith({
        where: { name: 'test-cron' },
        data: {
          lastPublishedAt: updateData.lastPublishedAt,
          page: updateData.page,
          pageSize: updateData.pageSize,
          interval: updateData.interval,
          isActive: updateData.isActive,
          updatedAt: expect.any(Date),
        },
      });
      expect(service['logger'].log).toHaveBeenCalledWith(
        'Cron job test-cron updated successfully',
      );
    });

    it('should log and throw an error if updating fails', async () => {
      jest
        .spyOn(prisma.jobState, 'update')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.updateCronJobDataByName('test-cron', {}),
      ).rejects.toThrow('Database error');
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Error updating cron job data for: test-cron',
      );
    });
  });
});
