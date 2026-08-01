import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import { ArticleBD } from '../IndexDB';
import type { ArticleDTO } from '../Model';
import { ArticleRepository } from '../Repository';

export class ArticleService {
  private static instance: ArticleService | null = null;

  public static getInstance(): ArticleService {
    if (!ArticleService.instance) {
      ArticleService.instance = new ArticleService();
    }
    return ArticleService.instance;
  }

  async getLocalAll(): Promise<ArticleDTO[]> {
    return ArticleBD.getInstance().getAllArticles();
  }

  async getLocalById(id: string): Promise<ArticleDTO | null> {
    return ArticleBD.getInstance().getArticleById(id);
  }

  /** Rafraîchit le cache local depuis le backend et notifie via ArticlesSynced. */
  async syncArticles(): Promise<void> {
    const articles = await ArticleRepository.getInstance().getAll();
    await ArticleBD.getInstance().saveArticles(articles);
    EventBus.getInstance().emit(AppEvent.ArticlesSynced, articles);
  }

  async adjustStockLocally(id: string, delta: number): Promise<ArticleDTO | null> {
    const article = await ArticleBD.getInstance().adjustStockLocally(id, delta);
    EventBus.getInstance().emit(AppEvent.ArticleStockSynced, article);
    return article;
  }
}
