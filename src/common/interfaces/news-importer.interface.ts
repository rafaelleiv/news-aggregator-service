export interface INewsImporter {
  importNews(): Promise<void>;
  detectTopics(newsData: any): Promise<{ topics: string[] }>;
  detectStates(newsData: any): Promise<{ states: string[] }>;
  sendNotification(newsData: any): void;
}
