import { Test, TestingModule } from '@nestjs/testing';
import { CronRepositoryService } from './cron-repository.service';

describe('CronRepositoryService', () => {
  let service: CronRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronRepositoryService],
    }).compile();

    service = module.get<CronRepositoryService>(CronRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
