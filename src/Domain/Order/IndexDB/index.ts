import type { OrderDTO } from '../Model';

export interface PendingOrder {
  localId: string;
  createdAt: number;
  order: OrderDTO;
}

export class OrderBD {
  private static instance: OrderBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'order-db';
  private readonly STORE = 'orders';

  private constructor() {}

  public static getInstance(): OrderBD {
    if (!OrderBD.instance) {
      OrderBD.instance = new OrderBD();
    }
    return OrderBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE, { keyPath: 'localId' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveOrder(order: OrderDTO): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put({
        localId: crypto.randomUUID(),
        createdAt: Date.now(),
        order,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllOrders(): Promise<PendingOrder[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve(req.result as PendingOrder[]);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteOrderById(localId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE, 'readwrite').objectStore(this.STORE).delete(localId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
