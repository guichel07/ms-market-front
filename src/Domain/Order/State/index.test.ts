import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderState, type OrderSnapshot } from '.';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { ClientDTO } from '../../Client/Model';
import type { OrderDTO } from '../Model';

describe('OrderState', () => {
  beforeEach(() => {
    (OrderState as unknown as { instance: OrderState | null }).instance = null;
    EventBus.getInstance().clear();
  });

  const client: ClientDTO = { id: 'c1', firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };

  const snapshot: OrderSnapshot = {
    items: [{ id: 1, name: 'Savon', price: 1000, quantity: 2 } as never],
    clientSelected: client,
  };

  const orderDTO: OrderDTO = {
    sellerName: 'Awa',
    email: 'seller@mama.sn',
    saleDate: new Date().toISOString(),
    dailySummary: 5000,
    clientId: 'c1',
    items: [{ articleId: 'a1', quantity: 2, price: 1000 }],
  };

  it('retourne toujours la même instance', () => {
    expect(OrderState.getInstance()).toBe(OrderState.getInstance());
  });

  it('démarre en SELLING sans snapshot ni client', () => {
    const state = OrderState.getInstance();

    expect(state.getCurrentState()).toBe('SELLING');
    expect(state.getCurrentSnapshot()).toBeNull();
    expect(state.getClientSelected()).toBeNull();
  });

  it('refuse RECAP sans snapshot', () => {
    const state = OrderState.getInstance();

    state.transitionTo('RECAP', undefined as never);

    expect(state.getCurrentState()).toBe('SELLING');
  });

  it('refuse RECAP avec un panier vide', () => {
    const state = OrderState.getInstance();

    state.transitionTo('RECAP', { items: [], clientSelected: null });

    expect(state.getCurrentState()).toBe('SELLING');
  });

  it('RECAP avec un snapshot valide met à jour le state et émet RecapStarted', () => {
    const state = OrderState.getInstance();
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    state.transitionTo('RECAP', snapshot);

    expect(state.getCurrentState()).toBe('RECAP');
    expect(state.getCurrentSnapshot()).toEqual(snapshot);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.RecapStarted, snapshot);
  });

  it('un second appel vers le même state est un no-op', () => {
    const state = OrderState.getInstance();
    state.transitionTo('RECAP', snapshot);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('RECAP', snapshot);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('CONFIRMED émet SaleRegistered avec le DTO de la commande — sans appel externe', () => {
    const state = OrderState.getInstance();
    state.transitionTo('RECAP', snapshot);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('CONFIRMED', orderDTO);

    expect(state.getCurrentState()).toBe('CONFIRMED');
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.SaleRegistered, orderDTO);
  });

  it('SELLING après RECAP annulé vide le snapshot mais garde le client sélectionné (resetClient: false)', () => {
    OrderState.init();
    const state = OrderState.getInstance();

    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, client);
    state.transitionTo('RECAP', snapshot);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('SELLING');

    expect(state.getCurrentState()).toBe('SELLING');
    expect(state.getCurrentSnapshot()).toBeNull();
    expect(state.getClientSelected()).toEqual(client);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.SellingStarted, { resetClient: false });
  });

  it('SELLING après CONFIRMED vide le client sélectionné (resetClient: true)', () => {
    const state = OrderState.getInstance();
    state.transitionTo('RECAP', snapshot);
    state.transitionTo('CONFIRMED', orderDTO);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('SELLING');

    expect(state.getCurrentState()).toBe('SELLING');
    expect(state.getClientSelected()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.SellingStarted, { resetClient: true });
  });

  it('reset remet SELLING sans client ni snapshot', () => {
    const state = OrderState.getInstance();
    state.transitionTo('RECAP', snapshot);

    state.reset();

    expect(state.getCurrentState()).toBe('SELLING');
    expect(state.getCurrentSnapshot()).toBeNull();
    expect(state.getClientSelected()).toBeNull();
  });

  it('init: Disconnected déclenche un reset', () => {
    OrderState.init();
    const state = OrderState.getInstance();
    state.transitionTo('RECAP', snapshot);

    EventBus.getInstance().emit(AppEvent.Disconnected, undefined);

    expect(state.getCurrentState()).toBe('SELLING');
    expect(state.getCurrentSnapshot()).toBeNull();
  });

  it('init: OnSelectCustomer met à jour le client sélectionné', () => {
    OrderState.init();
    const state = OrderState.getInstance();

    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, client);

    expect(state.getClientSelected()).toEqual(client);
  });

  it('init: ClientsUpdated rafraîchit le client sélectionné une fois synchronisé (même phone, id ajouté)', () => {
    OrderState.init();
    const state = OrderState.getInstance();
    const pendingClient: ClientDTO = { firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };

    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, pendingClient);
    expect(state.getClientSelected()?.id).toBeUndefined();

    EventBus.getInstance().emit(AppEvent.ClientsUpdated, [client]);

    expect(state.getClientSelected()).toEqual(client);
  });

  it('init: ClientsUpdated sans client sélectionné ne fait rien', () => {
    OrderState.init();
    const state = OrderState.getInstance();

    EventBus.getInstance().emit(AppEvent.ClientsUpdated, [client]);

    expect(state.getClientSelected()).toBeNull();
  });

  it('init: ClientsUpdated ignore les clients sans correspondance de phone', () => {
    OrderState.init();
    const state = OrderState.getInstance();
    const pendingClient: ClientDTO = { firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };

    EventBus.getInstance().emit(AppEvent.OnSelectCustomer, pendingClient);
    EventBus.getInstance().emit(AppEvent.ClientsUpdated, [
      { id: 'other', firstname: 'X', lastname: 'Y', phone: '0711111111' },
    ]);

    expect(state.getClientSelected()).toEqual(pendingClient);
  });
});
