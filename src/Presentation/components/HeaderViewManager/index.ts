import { Header } from 'tek-ms-header';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { CataloguePanel } from '../CataloguePanel';
import { ClientController } from '../../../Domain/Client/Controller';
import type { SellerData } from '../../../Domain/Auth/Model';
import { DailySalesController } from '../../../Domain/DailySales/Controller';
import { AuthState } from '../../../Domain/Auth/State';

const ICON = `
  <svg viewBox="0 0 100 100">
    <path d="M26 66 L26 36 L41 58 L50 38 L59 58 L74 36 L74 66"
          stroke="#FF6B35" stroke-width="10" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="50" cy="25" r="7" fill="#FF6B35"/>
  </svg>`;

export class HeaderViewManager extends Header {
  private static instance: HeaderViewManager | null = null;
  private dailySalesTotal = 0;

  public static getInstance() {
    if (!HeaderViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#screen-header');
      if (!el) throw new Error('#screen-header introuvable dans le DOM');
      HeaderViewManager.instance = new HeaderViewManager(el);
    }
    return HeaderViewManager.instance;
  }

  static reset() {
    HeaderViewManager.instance = null;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      HeaderViewManager.reset();
    });

    EventBus.getInstance().on(AppEvent.DailyTotalChanged, (newTotal) => {
      const instance = HeaderViewManager.getInstance();
      instance.dailySalesTotal = newTotal as number;
      instance.updateDailySalesTotal(instance.dailySalesTotal);
    });

    EventBus.getInstance().on(AppEvent.Connected, async (payload) => {
      const seller = payload as SellerData;
      const instance = HeaderViewManager.getInstance();
      instance.dailySalesTotal = await DailySalesController.getInstance().getTodayTotal();

      instance.render(
        { firstName: 'Maman', secondName: 'Solution', icone: ICON },
        {
          name: seller.name,
          role: seller.role,
          dailySalesTotal: instance.dailySalesTotal,
          tag: seller.tag,
          svgAvatar: seller.svgAvatar,
        },
        () => AuthState.getInstance().transitionTo('DISCONNECTED', null),
        () => EventBus.getInstance().emit(AppEvent.MenuOpened, undefined),
        () => {
          CataloguePanel.getInstance().sync();
          ClientController.getInstance().getAll();
        }
      );
    });
  }
}
