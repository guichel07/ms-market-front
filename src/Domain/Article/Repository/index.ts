import { API_URL_ARTICLES } from '../../../constants';
import type { ArticleDTO } from '../Model';

export class ArticleRepository {
  private static instance: ArticleRepository | null = null;

  public static getInstance(): ArticleRepository {
    if (!ArticleRepository.instance) {
      ArticleRepository.instance = new ArticleRepository();
    }
    return ArticleRepository.instance;
  }

  async getAll(): Promise<ArticleDTO[]> {
    const response = await fetch(`${API_URL_ARTICLES}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Erreur API (${response.status}): ${await response.text()}`);
    }
    return response.json();
  }
}
