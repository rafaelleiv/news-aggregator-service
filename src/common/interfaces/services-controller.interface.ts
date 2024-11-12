import { Response } from 'express';

export interface IServicesController {
  startCron(res: Response): void;
  pauseCron(res: Response): void;
}
