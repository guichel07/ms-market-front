import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleService } from '.';
import { ArticleBD } from '../IndexDB';
import { ArticleRepository } from '../Repository';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { ArticleDTO } from '../Model';

describe('ArticleService', () => {
  const bd = {
    getAllArticles: vi.fn(),
    getArticleById: vi.fn(),
    saveArticles: vi.fn(),
    adjustStockLocally: vi.fn(),
  };

  const repository = {
    getAll: vi.fn(),
  };

  const article: ArticleDTO = {
    id: 'a1',
    name: 'Savon noir',
    icon: 'soap',
    color: '#000',
    category: 'Soins',
    price: 1000,
    quantity: 10,
    unit: 'piece',
    criticalStock: 2,
    archived: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    vi.spyOn(ArticleBD, 'getInstance').mockReturnValue(bd as unknown as ArticleBD);
    vi.spyOn(ArticleRepository, 'getInstance').mockReturnValue(
      repository as unknown as ArticleRepository
    );
  });

  it('syncArticles sauvegarde en cache et émet ArticlesSynced (pas de dialogue navigateur)', async () => {
    repository.getAll.mockResolvedValue([article]);
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    await ArticleService.getInstance().syncArticles();

    expect(bd.saveArticles).toHaveBeenCalledWith([article]);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.ArticlesSynced, [article]);
  });

  it('syncArticles propage l\'erreur si le réseau échoue (pas de gestion silencieuse)', async () => {
    repository.getAll.mockRejectedValue(new Error('offline'));

    await expect(ArticleService.getInstance().syncArticles()).rejects.toThrow('offline');
  });

  it('adjustStockLocally délègue au cache et émet ArticleStockSynced', async () => {
    bd.adjustStockLocally.mockResolvedValue({ ...article, quantity: 9 });
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    const result = await ArticleService.getInstance().adjustStockLocally('a1', -1);

    expect(bd.adjustStockLocally).toHaveBeenCalledWith('a1', -1);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.ArticleStockSynced, {
      ...article,
      quantity: 9,
    });
    expect(result?.quantity).toBe(9);
  });
});
