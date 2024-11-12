import { Response } from 'express';

export abstract class ControllerPort {
  abstract startCron(res: Response): void;
  abstract stopCron(res: Response): void;
}
