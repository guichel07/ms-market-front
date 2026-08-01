import { AuthBD } from '../IndexDB';
import type { LoginCredentials, SellerData } from '../Model';
import { AuthRepository } from '../Repository';

export class AuthService {
  private static instance: AuthService | null = null;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<SellerData> {
    const seller = await AuthRepository.getInstance().login(credentials);
    await AuthBD.getInstance().saveSession(seller);
    return seller;
  }

  async logout(): Promise<void> {
    try {
      await AuthRepository.getInstance().logout();
    } finally {
      await AuthBD.getInstance().clearSession();
    }
  }

  /** Revalide auprès de ms-auth (nécessite le réseau) et rafraîchit le cache local. */
  async refreshSession(): Promise<SellerData> {
    const seller = await AuthRepository.getInstance().me();
    await AuthBD.getInstance().saveSession(seller);
    return seller;
  }

  /** Session locale seule (offline-first) — ne touche pas le réseau. */
  async getLocalSession(): Promise<SellerData | null> {
    return AuthBD.getInstance().getSession();
  }
}
