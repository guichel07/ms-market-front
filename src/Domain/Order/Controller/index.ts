import type { RecapItem } from 'tek-ms-recap';
import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import { AuthState } from '../../Auth/State';
import { DailySalesController } from '../../DailySales/Controller';
import type { OrderDTO, OrderLineDTO } from '../Model';
import { OrderService } from '../Service';
import { OrderState } from '../State';

export class OrderController {
  private static instance: OrderController | null = null;

  private constructor() {}

  public static getInstance(): OrderController {
    if (!OrderController.instance) {
      OrderController.instance = new OrderController();
    }
    return OrderController.instance;
  }

  async getAll() {
    return OrderService.getInstance().getAll();
  }

  async getLocalAll() {
    return OrderService.getInstance().getLocalAll();
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.SaleConfirmed, async (recapItems) => {
      const client = OrderState.getInstance().getClientSelected();
      if (!client) {
        EventBus.getInstance().emit(AppEvent.SaleRejected, {
          reason: 'no-client-selected',
        });
        return;
      }

      const seller = AuthState.getInstance().getCurrentSeller();
      const dailyTotal = await DailySalesController.getInstance().getTodayTotal();

      const items: OrderLineDTO[] = (recapItems as RecapItem[]).map((item) => ({
        articleId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const amount = items.reduce((total, item) => total + item.price * item.quantity, 0);

      // clientId peut être '' si le client vient d'être créé et n'a pas encore
      // d'id backend — la vente n'est pas bloquée pour autant : voir
      // OrderService.registerLocal/syncPending qui résout ça a posteriori via
      // pendingClientPhone une fois le client synchronisé.
      const orderDTO: OrderDTO = {
        sellerName: seller?.name ?? '',
        email: seller?.email ?? '',
        saleDate: new Date().toISOString(),
        dailySummary: dailyTotal + amount,
        clientId: client.id ?? '',
        items,
      };

      await OrderService.getInstance().registerLocal(
        orderDTO,
        client.id ? undefined : client.phone
      );
      await DailySalesController.getInstance().addToTodayTotal(amount);
    });
  }
}
