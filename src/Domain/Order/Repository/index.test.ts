import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderRepository } from '.';
import { API_URL_ORDERS } from '../../../constants';
import type { OrderDTO } from '../Model';

describe('OrderRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retourne toujours la même instance', () => {
    expect(OrderRepository.getInstance()).toBe(OrderRepository.getInstance());
  });

  it('register poste la commande avec clientId (pas customerPhone)', async () => {
    const order: OrderDTO = {
      sellerName: 'Awa',
      email: 'seller@mama.sn',
      saleDate: '2026-08-01T00:00:00.000Z',
      dailySummary: 5000,
      clientId: 'c1',
      items: [{ articleId: 'a1', quantity: 2, price: 1000 }],
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '{}' } as Response);

    await OrderRepository.getInstance().register(order);

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.clientId).toBe('c1');
    expect(body).not.toHaveProperty('customerPhone');
  });

  it('getTotalSoldToday utilise un query param email, pas un path param', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '5000' } as Response);

    await OrderRepository.getInstance().getTotalSoldToday('seller@mama.sn');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL_ORDERS}/total-today?email=seller%40mama.sn`,
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
  });
});
