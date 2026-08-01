import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArticleBD } from '.';
import type { ArticleDTO } from '../Model';

describe('ArticleBD', () => {
  let bd: ArticleBD;

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
    const prev = (ArticleBD as unknown as { instance: ArticleBD | null }).instance;
    (prev as unknown as { db: IDBDatabase | null } | undefined)?.db?.close();
    indexedDB.deleteDatabase('article-db');
    (ArticleBD as unknown as { instance: ArticleBD | null }).instance = null;
    bd = ArticleBD.getInstance();
  });

  it('retourne toujours la même instance', () => {
    expect(ArticleBD.getInstance()).toBe(ArticleBD.getInstance());
  });

  it('saveArticles remplace intégralement le cache', async () => {
    await bd.saveArticles([article]);
    await bd.saveArticles([{ ...article, id: 'a2', name: 'Beurre de karité' }]);

    const all = await bd.getAllArticles();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('a2');
  });

  it('getArticleById retourne null si absent', async () => {
    await expect(bd.getArticleById('inconnu')).resolves.toBeNull();
  });

  it('adjustStockLocally applique le delta et retourne null si article absent', async () => {
    await bd.saveArticles([article]);

    const updated = await bd.adjustStockLocally('a1', -3);
    expect(updated?.quantity).toBe(7);

    const missing = await bd.adjustStockLocally('inconnu', -1);
    expect(missing).toBeNull();
  });

  it('adjustStockLocally accepte un delta fractionnaire (article vendu au kilo)', async () => {
    await bd.saveArticles([{ ...article, id: 'riz', quantity: 5, unit: 'kg' }]);

    const updated = await bd.adjustStockLocally('riz', -0.5);
    expect(updated?.quantity).toBe(4.5);
  });
});
