import type { ClientDTO } from '../Model';

export interface PendingClient {
  phone: string;
  status: 'pending' | 'synced';
  client: ClientDTO;
}

export class ClientBD {
  private static instance: ClientBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'client-db';
  private readonly STORE = 'clients';

  private constructor() {}

  public static getInstance(): ClientBD {
    if (!ClientBD.instance) {
      ClientBD.instance = new ClientBD();
    }
    return ClientBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE, { keyPath: 'phone' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveClient(client: ClientDTO, status: 'pending' | 'synced'): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put({ phone: client.phone, client, status } as PendingClient);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllClients(): Promise<PendingClient[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve(req.result as PendingClient[]);
      req.onerror = () => reject(req.error);
    });
  }
}
