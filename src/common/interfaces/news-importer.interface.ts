export interface INewsImporter {
  importNews(cronName: string, lastPublishedArticleDate: string): Promise<void>;
  sendNotification(newsData: any): void;
}
