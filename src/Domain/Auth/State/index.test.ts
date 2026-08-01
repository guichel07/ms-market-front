import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthState } from '.';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { SellerData } from '../Model';

describe('AuthState', () => {
  beforeEach(() => {
    (AuthState as unknown as { instance: AuthState | null }).instance = null;
    EventBus.getInstance().clear();
  });

  const seller: SellerData = {
    id: 1,
    email: 'seller@mama.sn',
    name: 'Awa',
    tag: 'AW01',
    role: 'SELLER',
    svgAvatar: '<svg></svg>',
    contact: '0700000000',
    active: true,
  };

  it('retourne toujours la même instance', () => {
    expect(AuthState.getInstance()).toBe(AuthState.getInstance());
  });

  it('démarre sans état ni vendeur', () => {
    const state = AuthState.getInstance();

    expect(state.getCurrentState()).toBeNull();
    expect(state.getCurrentSeller()).toBeNull();
  });

  it('transitionTo CONNECTED avec un vendeur émet Connected', () => {
    const state = AuthState.getInstance();
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    state.transitionTo('CONNECTED', seller);

    expect(state.getCurrentState()).toBe('CONNECTED');
    expect(state.getCurrentSeller()).toEqual(seller);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.Connected, seller);
  });

  it('transitionTo CONNECTED sans vendeur retombe en DISCONNECTED', () => {
    const state = AuthState.getInstance();
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    state.transitionTo('CONNECTED', null);

    expect(state.getCurrentState()).toBe('DISCONNECTED');
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.Disconnected, undefined);
  });

  it('transitionTo DISCONNECTED vide le vendeur courant et émet Disconnected', () => {
    const state = AuthState.getInstance();
    state.transitionTo('CONNECTED', seller);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('DISCONNECTED', null);

    expect(state.getCurrentState()).toBe('DISCONNECTED');
    expect(state.getCurrentSeller()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.Disconnected, undefined);
  });

  it('un second appel vers le même état est un no-op (rien émis)', () => {
    const state = AuthState.getInstance();
    state.transitionTo('CONNECTED', seller);

    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');
    state.transitionTo('CONNECTED', seller);

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
