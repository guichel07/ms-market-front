import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import type { LoginCredentials, SellerData } from '../Model';
import { AuthService } from '../Service';

export class AuthController {
  private static instance: AuthController | null = null;

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      AuthController.getInstance().logout();
    });
  }

  async login(credentials: LoginCredentials): Promise<SellerData> {
    return AuthService.getInstance().login(credentials);
  }

  async logout(): Promise<void> {
    return AuthService.getInstance().logout();
  }

  async getLocalSession(): Promise<SellerData | null> {
    return AuthService.getInstance().getLocalSession();
  }

  async refreshSession(): Promise<SellerData> {
    return AuthService.getInstance().refreshSession();
  }
}
