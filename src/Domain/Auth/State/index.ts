import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import type { SellerData } from '../Model';

type AuthStateName = 'DISCONNECTED' | 'CONNECTED';

export class AuthState {
  private static instance: AuthState | null = null;
  private currentState: AuthStateName | null = null;
  private currentSeller: SellerData | null = null;

  public static getInstance(): AuthState {
    if (!AuthState.instance) {
      AuthState.instance = new AuthState();
    }
    return AuthState.instance;
  }

  public getCurrentState(): AuthStateName | null {
    return this.currentState;
  }

  public getCurrentSeller(): SellerData | null {
    return this.currentSeller;
  }

  /** Seul point d'entrée : fixe l'état ET émet l'événement associé. */
  public transitionTo(state: AuthStateName, seller: SellerData | null): void {
    if (state === this.currentState) return;

    if (state === 'DISCONNECTED' || !seller) {
      this.currentState = 'DISCONNECTED';
      this.currentSeller = null;
      EventBus.getInstance().emit(AppEvent.Disconnected, undefined);
      return;
    }

    this.currentState = 'CONNECTED';
    this.currentSeller = seller;
    EventBus.getInstance().emit(AppEvent.Connected, seller);
  }
}
