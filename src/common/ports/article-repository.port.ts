import { Article } from '../../../prisma/interfaces';

export abstract class ArticleRepositoryPort {
  abstract saveArticles(article: Article[]): Promise<any>;
}
