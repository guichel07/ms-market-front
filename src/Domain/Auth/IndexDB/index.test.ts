import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthBD } from '.';
import type { SellerData } from '../Model';

describe('AuthBD', () => {
  let authBD: AuthBD;

  const seller: SellerData = {
    id: 1,
    email: 'a@a.com',
    name: 'Awa',
    tag: 'AW01',
    role: 'SELLER',
    svgAvatar: '',
    contact: '0700000000',
    active: true,
  };

  beforeEach(() => {
    const prev = (AuthBD as unknown as { instance: AuthBD | null }).instance;
    (prev as unknown as { db: IDBDatabase | null } | undefined)?.db?.close();
    indexedDB.deleteDatabase('auth-db');
    (AuthBD as unknown as { instance: AuthBD | null }).instance = null;
    authBD = AuthBD.getInstance();
  });

  it('retourne toujours la même instance', () => {
    expect(AuthBD.getInstance()).toBe(AuthBD.getInstance());
  });

  it('getSession retourne null si aucune session sauvegardée', async () => {
    await expect(authBD.getSession()).resolves.toBeNull();
  });

  it('saveSession puis getSession retourne le vendeur sauvegardé', async () => {
    await authBD.saveSession(seller);

    await expect(authBD.getSession()).resolves.toEqual(seller);
  });

  it('getSession retourne null si la session a expiré', async () => {
    await authBD.saveSession(seller, -1);

    await expect(authBD.getSession()).resolves.toBeNull();
  });

  it('clearSession supprime la session', async () => {
    await authBD.saveSession(seller);
    await authBD.clearSession();

    await expect(authBD.getSession()).resolves.toBeNull();
  });
});
