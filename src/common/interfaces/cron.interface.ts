export interface ICronInterface {
  startCron(name: string, interval: string): void;
  stopCron(): void;
  removeCron(): void;
}
