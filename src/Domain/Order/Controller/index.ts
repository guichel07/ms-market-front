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
      if (!client?.id) {
        console.error(
          "Impossible d'enregistrer la vente : le client sélectionné n'a pas encore d'id backend (hors-ligne, en attente de synchro)."
        );
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

      const orderDTO: OrderDTO = {
        sellerName: seller?.name ?? '',
        email: seller?.email ?? '',
        saleDate: new Date().toISOString(),
        dailySummary: dailyTotal + amount,
        clientId: client.id,
        items,
      };

      await OrderService.getInstance().registerLocal(orderDTO);
      await DailySalesController.getInstance().addToTodayTotal(amount);
    });
  }
}
