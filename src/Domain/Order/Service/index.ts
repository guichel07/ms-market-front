import { OrderBD, type PendingOrder } from '../IndexDB';
import type { OrderDTO } from '../Model';
import { OrderRepository } from '../Repository';
import { OrderState } from '../State';

export class OrderService {
  private static instance: OrderService | null = null;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  async getAll() {
    return OrderRepository.getInstance().getAll();
  }

  async getLocalAll() {
    return OrderBD.getInstance().getAllOrders();
  }

  /** Pousse les commandes en attente vers le backend (retry offline-first). */
  async syncPending(): Promise<{ success: number; failed: number }> {
    const pendingOrders: PendingOrder[] = await OrderBD.getInstance().getAllOrders();
    const repository = OrderRepository.getInstance();
    const orderBD = OrderBD.getInstance();

    const results = await Promise.allSettled(
      pendingOrders.map(async (pendingOrder) => {
        await repository.register(pendingOrder.order);
        await orderBD.deleteOrderById(pendingOrder.localId);
      })
    );

    const failed = results.filter((r) => r.status === 'rejected');
    failed.forEach((r) => console.error((r as PromiseRejectedResult).reason));

    return { success: results.length - failed.length, failed: failed.length };
  }

  /**
   * Enregistre la vente en local (offline-first) et fait passer OrderState en
   * CONFIRMED — c'est OrderState qui émet SaleRegistered, pas cette méthode
   * (source unique de vérité, voir Order/State).
   */
  async registerLocal(orderDTO: OrderDTO): Promise<void> {
    await OrderBD.getInstance().saveOrder(orderDTO);
    OrderState.getInstance().transitionTo('CONFIRMED', orderDTO);
    await this.syncPending();
  }
}
