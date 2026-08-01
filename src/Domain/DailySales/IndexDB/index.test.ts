import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { DailySalesBD } from '.';

describe('DailySalesBD', () => {
  let bd: DailySalesBD;

  beforeEach(() => {
    const prev = (DailySalesBD as unknown as { instance: DailySalesBD | null }).instance;
    (prev as unknown as { db: IDBDatabase | null } | undefined)?.db?.close();
    indexedDB.deleteDatabase('dailySales-db');
    (DailySalesBD as unknown as { instance: DailySalesBD | null }).instance = null;
    bd = DailySalesBD.getInstance();
  });

  it('getTodayTotal retourne 0 si rien n\'a encore été vendu', async () => {
    await expect(bd.getTodayTotal()).resolves.toBe(0);
  });

  it('addToTodayTotal cumule les montants du jour', async () => {
    await bd.addToTodayTotal(1000);
    const total = await bd.addToTodayTotal(500);

    expect(total).toBe(1500);
    await expect(bd.getTodayTotal()).resolves.toBe(1500);
  });
});
