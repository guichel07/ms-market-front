import { SectionMenu } from 'tek-ms-menu';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';

export class MobileNavigationManager extends SectionMenu {
  private static instance: MobileNavigationManager | null = null;

  public static getInstance() {
    if (!MobileNavigationManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#menu-mobile');
      if (!el) throw new Error('#menu-mobile introuvable dans le DOM');
      MobileNavigationManager.instance = new MobileNavigationManager(el);
    }
    return MobileNavigationManager.instance;
  }

  static reset() {
    MobileNavigationManager.instance = null;
  }

  static render() {
    if (!document.body.querySelector('#section-overlay')) {
      MobileNavigationManager.getInstance().render({
        sections: [
          { key: 'Catalogue', label: 'Catalogue' },
          { key: 'Déconnexion', label: 'Déconnexion' },
        ],
        activeKey: 'Catalogue',
        onSelect: (key) => {
          EventBus.getInstance().emit(AppEvent.MenuItemSelected, key);
        },
      });
    }
    MobileNavigationManager.getInstance().openSectionMenu();
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      MobileNavigationManager.reset();
    });
    EventBus.getInstance().on(AppEvent.MenuOpened, () => MobileNavigationManager.render());
  }
}
