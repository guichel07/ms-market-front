import { Confirm } from 'tek-ms-confirm';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { DailySalesController } from '../../../Domain/DailySales/Controller';
import { OrderState } from '../../../Domain/Order/State';
import type { OrderDTO } from '../../../Domain/Order/Model';

export class ConfirmViewManager extends Confirm {
  private static instance: ConfirmViewManager | null = null;

  public static getInstance() {
    if (!ConfirmViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#container-confirm-screen');
      if (!el) throw new Error('#container-confirm-screen introuvable dans le DOM');
      ConfirmViewManager.instance = new ConfirmViewManager(el);
    }
    return ConfirmViewManager.instance;
  }

  static reset() {
    ConfirmViewManager.instance = null;
  }

  showConfirmScreen(): void {
    const appScreen = document.getElementById('app-screen');
    const confirmScreen = document.getElementById('confirm-screen');
    if (appScreen) appScreen.style.display = 'none';
    if (confirmScreen) confirmScreen.style.display = 'flex';
  }

  returnToAppAfterConfirmation(): void {
    const appScreen = document.getElementById('app-screen');
    const confirmScreen = document.getElementById('confirm-screen');
    if (confirmScreen) confirmScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      ConfirmViewManager.reset();
    });

    EventBus.getInstance().on(AppEvent.SaleRegistered, async (payload) => {
      const order = payload as OrderDTO;
      const instance = ConfirmViewManager.getInstance();
      instance.showConfirmScreen();

      const amount = order.items.reduce((total, line) => total + line.price * line.quantity, 0);
      const articlesCount = order.items.reduce((total, line) => total + line.quantity, 0);
      const dailyTotal = await DailySalesController.getInstance().getTodayTotal();

      instance.render({
        amount,
        articles: articlesCount,
        dailyTotal,
        onNewSale: () => {
          OrderState.getInstance().transitionTo('SELLING');
          instance.returnToAppAfterConfirmation();
        },
        onClickRecu: () => {
          EventBus.getInstance().emit(AppEvent.ConfirmationClickRecu, undefined);
        },
      });
    });
  }
}
