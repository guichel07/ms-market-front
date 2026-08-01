import type { ArticleDTO } from '../Model';

export class ArticleBD {
  private static instance: ArticleBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'article-db';
  private readonly STORE = 'articles';

  private constructor() {}

  public static getInstance(): ArticleBD {
    if (!ArticleBD.instance) {
      ArticleBD.instance = new ArticleBD();
    }
    return ArticleBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveArticles(articles: ArticleDTO[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      store.clear();
      articles.forEach((article) => store.put(article));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllArticles(): Promise<ArticleDTO[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve(req.result as ArticleDTO[]);
      req.onerror = () => reject(req.error);
    });
  }

  async getArticleById(id: string): Promise<ArticleDTO | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).get(id);
      req.onsuccess = () => resolve(req.result ? (req.result as ArticleDTO) : null);
      req.onerror = () => reject(req.error);
    });
  }

  /** Ajustement optimiste du stock local (panier), avant confirmation réseau. */
  async adjustStockLocally(id: string, delta: number): Promise<ArticleDTO | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const article = getReq.result as ArticleDTO | undefined;
        if (!article) {
          resolve(null);
          return;
        }
        article.quantity += delta;
        const putReq = store.put(article);
        putReq.onsuccess = () => resolve(article);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}
