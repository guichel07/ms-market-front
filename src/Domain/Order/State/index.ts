import type { CartItem } from 'tek-ms-barket';
import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import type { ClientDTO } from '../../Client/Model';
import type { OrderDTO } from '../Model';

export interface OrderSnapshot {
  items: CartItem[];
  clientSelected: ClientDTO | null;
}

type OrderStateName = 'SELLING' | 'RECAP' | 'CONFIRMED';

/**
 * Seul point d'entrée pour changer d'état de vente : transitionTo() fixe
 * l'état ET émet lui-même l'événement associé (même principe que RouteState
 * côté ms-front-admin) — les appelants n'émettent plus jamais ces événements
 * eux-mêmes, ce qui évite la désynchronisation état/UI.
 */
export class OrderState {
  private static instance: OrderState | null = null;
  private currentState: OrderStateName = 'SELLING';
  private currentSnapshot: OrderSnapshot | null = null;
  private clientSelected: ClientDTO | null = null;

  public static getInstance(): OrderState {
    if (!OrderState.instance) {
      OrderState.instance = new OrderState();
    }
    return OrderState.instance;
  }

  public getCurrentState(): OrderStateName {
    return this.currentState;
  }

  public getCurrentSnapshot(): OrderSnapshot | null {
    return this.currentSnapshot;
  }

  public getClientSelected(): ClientDTO | null {
    return this.clientSelected;
  }

  private setClientSelected(client: ClientDTO | null): void {
    this.clientSelected = client;
  }

  public transitionTo(state: 'RECAP', snapshot: OrderSnapshot): void;
  public transitionTo(state: 'CONFIRMED', order: OrderDTO): void;
  public transitionTo(state: 'SELLING'): void;
  public transitionTo(state: OrderStateName, payload?: OrderSnapshot | OrderDTO): void {
    if (state === 'RECAP' && (!payload || (payload as OrderSnapshot).items.length === 0)) {
      return;
    }
    if (state === this.currentState) {
      return;
    }

    const previousState = this.currentState;
    this.currentState = state;
    this.emitState(state, previousState, payload);
  }

  private emitState(
    state: OrderStateName,
    previousState: OrderStateName,
    payload?: OrderSnapshot | OrderDTO
  ): void {
    switch (state) {
      case 'RECAP': {
        const snapshot = payload as OrderSnapshot;
        this.currentSnapshot = snapshot;
        EventBus.getInstance().emit(AppEvent.RecapStarted, snapshot);
        break;
      }
      case 'SELLING': {
        this.currentSnapshot = null;
        const isFreshSale = previousState === 'CONFIRMED';
        if (isFreshSale) {
          this.setClientSelected(null);
        }
        // resetClient indique explicitement si le client/panier doivent être
        // vidés (nouvelle vente après confirmation) ou conservés (annulation
        // du récap, retour à la même vente en cours).
        EventBus.getInstance().emit(AppEvent.SellingStarted, { resetClient: isFreshSale });
        break;
      }
      case 'CONFIRMED':
        EventBus.getInstance().emit(AppEvent.SaleRegistered, payload as OrderDTO);
        break;
    }
  }

  public reset(): void {
    this.currentState = 'SELLING';
    this.currentSnapshot = null;
    this.setClientSelected(null);
  }

  public static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      OrderState.getInstance().reset();
    });

    EventBus.getInstance().on(AppEvent.OnSelectCustomer, (payload) => {
      OrderState.getInstance().setClientSelected(payload as ClientDTO);
    });

    // Un client créé pendant la vente est sélectionné immédiatement (avant sync
    // backend), donc sans id — sans ce listener, clientSelected reste bloqué
    // sans id pour toute la vente même une fois la synchro réussie, et la
    // confirmation de vente échoue silencieusement (voir OrderController).
    EventBus.getInstance().on(AppEvent.ClientsUpdated, (payload) => {
      const clients = payload as ClientDTO[];
      const current = OrderState.getInstance().getClientSelected();
      if (!current) return;
      const refreshed = clients.find((c) => c.phone === current.phone);
      if (refreshed) OrderState.getInstance().setClientSelected(refreshed);
    });
  }
}
