import { Login } from 'ms-login';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { AuthController } from '../../../Domain/Auth/Controller';
import { AuthState } from '../../../Domain/Auth/State';

export class LoginPage extends Login {
  private static instance: LoginPage | null = null;

  static reset() {
    LoginPage.instance = null;
  }

  static getInstance() {
    if (!LoginPage.instance) {
      const app = document.querySelector<HTMLDivElement>('#app');
      if (!app) throw new Error('#app introuvable dans le DOM');
      LoginPage.instance = new LoginPage(app);
    }
    return LoginPage.instance;
  }

  onLogin = async (email: string, password: string) => {
    try {
      const seller = await AuthController.getInstance().login({ email, password });
      AuthState.getInstance().transitionTo('CONNECTED', seller);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      LoginPage.getInstance().showError(message);
    }
  };

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      LoginPage.reset();
      LoginPage.getInstance().render({
        onLogin: (email, password) => LoginPage.getInstance().onLogin(email, password),
      });
    });

    EventBus.getInstance().on(AppEvent.MenuItemSelected, (key) => {
      if (key !== 'Déconnexion') return;
      AuthState.getInstance().transitionTo('DISCONNECTED', null);
    });

    EventBus.getInstance().on(AppEvent.NavItemSelected, (key) => {
      if (key !== 'Déconnexion') return;
      AuthState.getInstance().transitionTo('DISCONNECTED', null);
    });
  }
}
