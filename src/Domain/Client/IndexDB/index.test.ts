import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClientBD } from '.';
import type { ClientDTO } from '../Model';

describe('ClientBD', () => {
  let bd: ClientBD;

  const client: ClientDTO = { firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };

  beforeEach(() => {
    const prev = (ClientBD as unknown as { instance: ClientBD | null }).instance;
    (prev as unknown as { db: IDBDatabase | null } | undefined)?.db?.close();
    indexedDB.deleteDatabase('client-db');
    (ClientBD as unknown as { instance: ClientBD | null }).instance = null;
    bd = ClientBD.getInstance();
  });

  it('retourne toujours la même instance', () => {
    expect(ClientBD.getInstance()).toBe(ClientBD.getInstance());
  });

  it('saveClient puis getAllClients retourne le client avec son statut', async () => {
    await bd.saveClient(client, 'pending');

    const all = await bd.getAllClients();
    expect(all).toEqual([{ phone: client.phone, client, status: 'pending' }]);
  });

  it('saveClient avec le même téléphone écrase la version précédente', async () => {
    await bd.saveClient(client, 'pending');
    const synced: ClientDTO = { ...client, id: 'c1' };
    await bd.saveClient(synced, 'synced');

    const all = await bd.getAllClients();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ phone: client.phone, client: synced, status: 'synced' });
  });
});
