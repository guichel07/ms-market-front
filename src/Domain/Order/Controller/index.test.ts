import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderController } from '.';
import { OrderService } from '../Service';
import { OrderState } from '../State';
import { AuthState } from '../../Auth/State';
import { DailySalesController } from '../../DailySales/Controller';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { RecapItem } from 'tek-ms-recap';

describe('OrderController', () => {
  const orderService = { registerLocal: vi.fn() };
  const dailySalesController = { getTodayTotal: vi.fn(), addToTodayTotal: vi.fn() };

  const seller = {
    id: 1,
    email: 'seller@mama.sn',
    name: 'Awa',
    tag: 'AW01',
    role: 'SELLER',
    svgAvatar: '',
    contact: '0700000000',
    active: true,
  };

  const recapItems: RecapItem[] = [
    { id: 'a1', name: 'Savon', icon: '', color: '', category: 'Soins', price: 1000, quantity: 2 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    (OrderState as unknown as { instance: OrderState | null }).instance = null;
    (AuthState as unknown as { instance: AuthState | null }).instance = null;

    dailySalesController.getTodayTotal.mockResolvedValue(3000);
    vi.spyOn(OrderService, 'getInstance').mockReturnValue(
      orderService as unknown as OrderService
    );
    vi.spyOn(DailySalesController, 'getInstance').mockReturnValue(
      dailySalesController as unknown as DailySalesController
    );

    AuthState.getInstance().transitionTo('CONNECTED', seller);
  });

  it("SaleConfirmed sans aucun client sélectionné n'enregistre rien", async () => {
    OrderController.init();

    await EventBus.getInstance().emit(AppEvent.SaleConfirmed, recapItems);

    expect(orderService.registerLocal).not.toHaveBeenCalled();
  });

  it('SaleConfirmed sans aucun client sélectionné émet SaleRejected au lieu de rater silencieusement', async () => {
    OrderController.init();
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    await EventBus.getInstance().emit(AppEvent.SaleConfirmed, recapItems);

    expect(emitSpy).toHaveBeenCalledWith(
      AppEvent.SaleRejected,
      expect.objectContaining({ reason: 'no-client-selected' })
    );
  });

  it("SaleConfirmed avec un client sélectionné mais pas encore synchronisé (sans id) n'est PAS bloqué — enregistre en local avec le téléphone en attente", async () => {
    OrderState.init();
    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, {
      firstname: 'Fatou',
      lastname: 'Ba',
      phone: '0700000000',
    });
    OrderState.getInstance().transitionTo('RECAP', {
      items: recapItems as never,
      clientSelected: { firstname: 'Fatou', lastname: 'Ba', phone: '0700000000' },
    });

    OrderController.init();
    await EventBus.getInstance().emit(AppEvent.SaleConfirmed, recapItems);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(orderService.registerLocal).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: '' }),
      '0700000000'
    );
  });

  it('SaleConfirmed avec un client valide construit le bon OrderDTO (clientId, pas customerPhone)', async () => {
    OrderState.init();
    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, {
      id: 'c1',
      firstname: 'Fatou',
      lastname: 'Ba',
      phone: '0700000000',
    });
    OrderState.getInstance().transitionTo('RECAP', {
      items: recapItems as never,
      clientSelected: { id: 'c1', firstname: 'Fatou', lastname: 'Ba', phone: '0700000000' },
    });

    OrderController.init();
    await EventBus.getInstance().emit(AppEvent.SaleConfirmed, recapItems);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(orderService.registerLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerName: 'Awa',
        email: 'seller@mama.sn',
        clientId: 'c1',
        dailySummary: 5000, // 3000 (total déjà fait) + 2000 (2 x 1000)
        items: [{ articleId: 'a1', quantity: 2, price: 1000 }],
      }),
      undefined
    );
    expect(dailySalesController.addToTodayTotal).toHaveBeenCalledWith(2000);
  });

  it('SaleConfirmed propage soldAsLabel depuis les items du récap vers les lignes de commande', async () => {
    OrderState.init();
    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, {
      id: 'c1',
      firstname: 'Fatou',
      lastname: 'Ba',
      phone: '0700000000',
    });
    const cartonItems = [
      { id: 'a1', name: 'Lait en poudre', price: 11000, quantity: 1, soldAsLabel: 'Carton de 12' },
    ];
    OrderState.getInstance().transitionTo('RECAP', {
      items: cartonItems as never,
      clientSelected: { id: 'c1', firstname: 'Fatou', lastname: 'Ba', phone: '0700000000' },
    });

    OrderController.init();
    await EventBus.getInstance().emit(AppEvent.SaleConfirmed, cartonItems);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(orderService.registerLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ articleId: 'a1', quantity: 1, price: 11000, soldAsLabel: 'Carton de 12' }],
      }),
      undefined
    );
  });
});
