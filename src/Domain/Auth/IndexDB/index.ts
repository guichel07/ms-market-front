import type { SellerData } from '../Model';

/**
 * Cache offline de la session vendeur — permet à l'app de rester utilisable
 * (login déjà fait) même sans réseau, pendant la durée du JWT (1h côté ms-auth).
 */
export class AuthBD {
  private static instance: AuthBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'auth-db';
  private readonly STORE = 'session';
  private readonly KEY = 'current_seller';

  private constructor() {}

  public static getInstance(): AuthBD {
    if (!AuthBD.instance) {
      AuthBD.instance = new AuthBD();
    }
    return AuthBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      // v2 : recrée le store avec keyPath. Une base "auth-db" v1 laissée par une
      // build antérieure (out-of-line keys) faisait échouer put() en silence
      // (onupgradeneeded ne se redéclenche pas si la version n'a pas changé).
      const req = indexedDB.open(this.DB_NAME, 2);
      req.onupgradeneeded = () => {
        if (req.result.objectStoreNames.contains(this.STORE)) {
          req.result.deleteObjectStore(this.STORE);
        }
        req.result.createObjectStore(this.STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSession(seller: SellerData, expiresInSeconds = 3600): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put({
        id: this.KEY,
        seller,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSession(): Promise<SellerData | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).get(this.KEY);
      req.onsuccess = () => {
        const data = req.result;
        if (!data) return resolve(null);
        if (Date.now() > data.expiresAt) {
          this.clearSession().finally(() => resolve(null));
          return;
        }
        resolve(data.seller as SellerData);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearSession(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).delete(this.KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
