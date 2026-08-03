import { ClientService } from '../../Client/Service';
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

  /**
   * Pousse les commandes en attente vers le backend (retry offline-first).
   * Une commande dont le client n'était pas encore synchronisé au moment de
   * la vente (pendingClientPhone) est résolue ici : si le client a depuis
   * obtenu un id réel, on patch clientId et on tente l'envoi ; sinon on la
   * laisse en attente (ni envoyée, ni supprimée) pour un prochain essai.
   */
  async syncPending(): Promise<{ success: number; failed: number }> {
    const pendingOrders: PendingOrder[] = await OrderBD.getInstance().getAllOrders();
    const repository = OrderRepository.getInstance();
    const orderBD = OrderBD.getInstance();

    const resolved: PendingOrder[] = [];
    for (const pendingOrder of pendingOrders) {
      if (!pendingOrder.pendingClientPhone) {
        resolved.push(pendingOrder);
        continue;
      }
      const clients = await ClientService.getInstance().getAllLocal();
      const client = clients.find((c) => c.phone === pendingOrder.pendingClientPhone && c.id);
      if (!client?.id) continue; // toujours pas synchronisé, on retentera plus tard
      await orderBD.resolveClientId(pendingOrder.localId, client.id);
      resolved.push({ ...pendingOrder, order: { ...pendingOrder.order, clientId: client.id } });
    }

    const results = await Promise.allSettled(
      resolved.map(async (pendingOrder) => {
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
   * (source unique de vérité, voir Order/State). pendingClientPhone : voir
   * syncPending, renseigné quand le client n'a pas encore d'id backend.
   */
  async registerLocal(orderDTO: OrderDTO, pendingClientPhone?: string): Promise<void> {
    await OrderBD.getInstance().saveOrder(orderDTO, pendingClientPhone);
    OrderState.getInstance().transitionTo('CONFIRMED', orderDTO);
    await this.syncPending();
  }
}
