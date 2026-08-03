import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderService } from '.';
import { OrderBD } from '../IndexDB';
import { OrderRepository } from '../Repository';
import { OrderState } from '../State';
import { ClientService } from '../../Client/Service';
import type { OrderDTO } from '../Model';

vi.mock('../IndexDB');
vi.mock('../Repository');
vi.mock('../../Client/Service');

describe('OrderService', () => {
  let service: OrderService;

  const db = {
    getAllOrders: vi.fn(),
    saveOrder: vi.fn(),
    deleteOrderById: vi.fn(),
    resolveClientId: vi.fn(),
  };

  const repo = {
    getAll: vi.fn(),
    register: vi.fn(),
  };

  const clientService = {
    getAllLocal: vi.fn(),
  };

  const order: OrderDTO = {
    sellerName: 'Awa',
    email: 'seller@mama.sn',
    saleDate: '2026-08-01T00:00:00.000Z',
    dailySummary: 5000,
    clientId: 'c1',
    items: [{ articleId: 'a1', quantity: 2, price: 1000 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = OrderService.getInstance();
    db.getAllOrders.mockResolvedValue([]);
    clientService.getAllLocal.mockResolvedValue([]);
    vi.spyOn(OrderBD, 'getInstance').mockReturnValue(db as unknown as OrderBD);
    vi.spyOn(OrderRepository, 'getInstance').mockReturnValue(repo as unknown as OrderRepository);
    vi.spyOn(ClientService, 'getInstance').mockReturnValue(
      clientService as unknown as ClientService
    );
    (OrderState as unknown as { instance: OrderState | null }).instance = null;
  });

  it('registerLocal sauvegarde en local et fait transitionner OrderState en CONFIRMED', async () => {
    const transitionSpy = vi.spyOn(OrderState.getInstance(), 'transitionTo');

    await service.registerLocal(order);

    expect(db.saveOrder).toHaveBeenCalledWith(order, undefined);
    expect(transitionSpy).toHaveBeenCalledWith('CONFIRMED', order);
  });

  it('registerLocal transmet le téléphone du client en attente de synchro', async () => {
    await service.registerLocal({ ...order, clientId: '' }, '0700000000');

    expect(db.saveOrder).toHaveBeenCalledWith({ ...order, clientId: '' }, '0700000000');
  });

  it('syncPending pousse les commandes en attente et les supprime du cache local', async () => {
    db.getAllOrders.mockResolvedValue([{ localId: 'l1', createdAt: 1, order }]);
    repo.register.mockResolvedValue(undefined);

    const result = await service.syncPending();

    expect(repo.register).toHaveBeenCalledWith(order);
    expect(db.deleteOrderById).toHaveBeenCalledWith('l1');
    expect(result).toEqual({ success: 1, failed: 0 });
  });

  it('syncPending compte les échecs sans bloquer les autres commandes', async () => {
    db.getAllOrders.mockResolvedValue([
      { localId: 'l1', createdAt: 1, order },
      { localId: 'l2', createdAt: 2, order },
    ]);
    repo.register.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));

    const result = await service.syncPending();

    expect(result).toEqual({ success: 1, failed: 1 });
  });

  it('syncPending résout un client synchronisé (patch clientId) puis enregistre la commande', async () => {
    const pendingOrder = { ...order, clientId: '' };
    db.getAllOrders.mockResolvedValue([
      { localId: 'l1', createdAt: 1, order: pendingOrder, pendingClientPhone: '0700000000' },
    ]);
    clientService.getAllLocal.mockResolvedValue([
      { id: 'c1', firstname: 'Awa', lastname: 'Diop', phone: '0700000000' },
    ]);
    repo.register.mockResolvedValue(undefined);

    const result = await service.syncPending();

    expect(db.resolveClientId).toHaveBeenCalledWith('l1', 'c1');
    expect(repo.register).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'c1' })
    );
    expect(db.deleteOrderById).toHaveBeenCalledWith('l1');
    expect(result).toEqual({ success: 1, failed: 0 });
  });

  it('syncPending laisse en attente une commande dont le client n\'est toujours pas synchronisé', async () => {
    const pendingOrder = { ...order, clientId: '' };
    db.getAllOrders.mockResolvedValue([
      { localId: 'l1', createdAt: 1, order: pendingOrder, pendingClientPhone: '0700000000' },
    ]);
    clientService.getAllLocal.mockResolvedValue([]);

    const result = await service.syncPending();

    expect(repo.register).not.toHaveBeenCalled();
    expect(db.deleteOrderById).not.toHaveBeenCalled();
    expect(db.resolveClientId).not.toHaveBeenCalled();
    expect(result).toEqual({ success: 0, failed: 0 });
  });
});
