import type { AgeCategory, ClientDTO, Gender } from '../Model';

export interface PendingClient {
  phone: string;
  status: 'pending' | 'synced';
  client: ClientDTO;
}

/** Clé composite stable pour désigner un des 6 profils anonymes possibles. */
export function anonymousProfileKey(ageCategory: AgeCategory, gender: Gender): string {
  return `${ageCategory}_${gender}`;
}

/**
 * Cache local des 6 fiches client anonymes (une par couple ageCategory/gender) —
 * synchronisé une fois à la connexion (voir ClientController.syncAnonymousProfiles)
 * pour que la sélection d'un profil en caisse soit instantanée et dispose toujours
 * d'un id backend réel, sans dépendre du réseau au moment de la vente.
 */
export class AnonymousClientBD {
  private static instance: AnonymousClientBD | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'anonymous-client-db';
  private readonly STORE = 'profiles';

  private constructor() {}

  public static getInstance(): AnonymousClientBD {
    if (!AnonymousClientBD.instance) {
      AnonymousClientBD.instance = new AnonymousClientBD();
    }
    return AnonymousClientBD.instance;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE, { keyPath: 'key' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveProfile(client: ClientDTO): Promise<void> {
    if (!client.ageCategory || !client.gender) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put({
        key: anonymousProfileKey(client.ageCategory!, client.gender!),
        client,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllProfiles(): Promise<ClientDTO[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(this.STORE).objectStore(this.STORE).getAll();
      req.onsuccess = () =>
        resolve((req.result as { key: string; client: ClientDTO }[]).map((r) => r.client));
      req.onerror = () => reject(req.error);
    });
  }
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
