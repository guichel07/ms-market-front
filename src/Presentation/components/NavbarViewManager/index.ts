import { Nav } from 'tek-ms-nav';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { AuthState } from '../../../Domain/Auth/State';

export class NavbarViewManager extends Nav {
  private static instance: NavbarViewManager | null = null;

  public static getInstance() {
    if (!NavbarViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#screen-nav');
      if (!el) throw new Error('#screen-nav introuvable dans le DOM');
      NavbarViewManager.instance = new NavbarViewManager(el);
    }
    return NavbarViewManager.instance;
  }

  static reset() {
    NavbarViewManager.instance = null;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      NavbarViewManager.reset();
    });
    EventBus.getInstance().on(AppEvent.Connected, () =>
      NavbarViewManager.getInstance().render({
        items: [
          { id: 'Catalogue', label: 'Catalogue' },
          { id: 'Déconnexion', label: 'Déconnexion' },
        ],
        activeId: 'Catalogue',
        onSelect: (id: string) => {
          if (id === 'Déconnexion') {
            AuthState.getInstance().transitionTo('DISCONNECTED', null);
          }
        },
      })
    );
  }
}
