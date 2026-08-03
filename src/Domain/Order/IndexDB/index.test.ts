import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrderBD } from '.';
import type { OrderDTO } from '../Model';

describe('OrderBD', () => {
  let bd: OrderBD;

  const order: OrderDTO = {
    sellerName: 'Awa',
    email: 'seller@mama.sn',
    saleDate: '2026-08-01T00:00:00.000Z',
    dailySummary: 5000,
    clientId: 'c1',
    items: [{ articleId: 'a1', quantity: 2, price: 1000 }],
  };

  beforeEach(() => {
    const prev = (OrderBD as unknown as { instance: OrderBD | null }).instance;
    (prev as unknown as { db: IDBDatabase | null } | undefined)?.db?.close();
    indexedDB.deleteDatabase('order-db');
    (OrderBD as unknown as { instance: OrderBD | null }).instance = null;
    bd = OrderBD.getInstance();
  });

  it('retourne toujours la même instance', () => {
    expect(OrderBD.getInstance()).toBe(OrderBD.getInstance());
  });

  it('saveOrder puis getAllOrders retourne la commande avec un localId généré', async () => {
    await bd.saveOrder(order);

    const all = await bd.getAllOrders();
    expect(all).toHaveLength(1);
    expect(all[0].order).toEqual(order);
    expect(all[0].localId).toBeTruthy();
  });

  it('deleteOrderById supprime la commande', async () => {
    await bd.saveOrder(order);
    const [saved] = await bd.getAllOrders();

    await bd.deleteOrderById(saved.localId);

    await expect(bd.getAllOrders()).resolves.toHaveLength(0);
  });

  it('saveOrder avec pendingClientPhone le conserve tel quel', async () => {
    await bd.saveOrder({ ...order, clientId: '' }, '0700000000');

    const [saved] = await bd.getAllOrders();
    expect(saved.pendingClientPhone).toBe('0700000000');
    expect(saved.order.clientId).toBe('');
  });

  it('resolveClientId patch clientId et retire pendingClientPhone', async () => {
    await bd.saveOrder({ ...order, clientId: '' }, '0700000000');
    const [saved] = await bd.getAllOrders();

    await bd.resolveClientId(saved.localId, 'c1');

    const [updated] = await bd.getAllOrders();
    expect(updated.order.clientId).toBe('c1');
    expect(updated.pendingClientPhone).toBeUndefined();
  });
});
