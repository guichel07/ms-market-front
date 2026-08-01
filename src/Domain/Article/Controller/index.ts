import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import type { ArticleDTO } from '../Model';
import { ArticleService } from '../Service';

export class ArticleController {
  private static instance: ArticleController | null = null;

  private constructor() {}

  public static getInstance(): ArticleController {
    if (!ArticleController.instance) {
      ArticleController.instance = new ArticleController();
    }
    return ArticleController.instance;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Connected, () => {
      ArticleController.getInstance().syncArticles();
    });
  }

  async syncArticles(): Promise<void> {
    return ArticleService.getInstance().syncArticles();
  }

  async getLocalAll(): Promise<ArticleDTO[]> {
    return ArticleService.getInstance().getLocalAll();
  }

  async getLocalById(id: string): Promise<ArticleDTO | null> {
    return ArticleService.getInstance().getLocalById(id);
  }

  async adjustStockLocally(id: string, delta: number): Promise<ArticleDTO | null> {
    return ArticleService.getInstance().adjustStockLocally(id, delta);
  }
}
