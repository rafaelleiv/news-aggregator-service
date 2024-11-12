import { Response } from 'express';

export interface IServicesController {
  startCron(res: Response): void;
  stopCron(res: Response): void;
}
