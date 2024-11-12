export abstract class CronServicePort {
  abstract startCron(): void;
  abstract stopCron(): void;
}
