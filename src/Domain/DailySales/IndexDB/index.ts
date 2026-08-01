export class DailySalesBD {
  private static instance: DailySalesBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'dailySales-db';
  private readonly STORE = 'dailySales';

  private constructor() {}

  public static getInstance(): DailySalesBD {
    if (!DailySalesBD.instance) {
      DailySalesBD.instance = new DailySalesBD();
    }
    return DailySalesBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE, { keyPath: 'date' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  private getTodayKey(): string {
    return new Date().toDateString();
  }

  async getTodayTotal(): Promise<number> {
    const db = await this.getDB();
    const today = this.getTodayKey();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).get(today);
      req.onsuccess = () => {
        const data = req.result as { date: string; total: number } | undefined;
        resolve(data?.total ?? 0);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async addToTodayTotal(amount: number): Promise<number> {
    const db = await this.getDB();
    const today = this.getTodayKey();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const getReq = store.get(today);

      getReq.onsuccess = () => {
        const existing = getReq.result as { date: string; total: number } | undefined;
        const newTotal = (existing?.total ?? 0) + amount;
        const putReq = store.put({ date: today, total: newTotal });
        putReq.onsuccess = () => resolve(newTotal);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}
