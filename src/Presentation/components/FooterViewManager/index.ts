import { Footer } from 'tek-ms-footer';
import { EventBus } from '../../../EventBus';
import { AppEvent, FOOTER_MASSAGE } from '../../../constants';

export class FooterViewManager extends Footer {
  private static instance: FooterViewManager | null = null;

  public static getInstance() {
    if (!FooterViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#screen-footer');
      if (!el) throw new Error('#screen-footer introuvable dans le DOM');
      FooterViewManager.instance = new FooterViewManager(el);
    }
    return FooterViewManager.instance;
  }

  static reset() {
    FooterViewManager.instance = null;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      FooterViewManager.reset();
    });
    EventBus.getInstance().on(AppEvent.Connected, () =>
      FooterViewManager.getInstance().render(FOOTER_MASSAGE)
    );
  }
}
