export interface INewsImporter {
  importNews(lastPublishedArticleDate: string): Promise<void>;
  sendNotification(newsData: any): void;
}
