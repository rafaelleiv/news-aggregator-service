export abstract class NewsImporterPort {
  abstract importNews(
    cronName: string,
    lastPublishedArticleDate: string,
  ): Promise<void>;
  abstract sendNotification(newsData: any): void;
}
