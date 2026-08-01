import { API_URL_AUTH } from '../../../constants';
import type { LoginCredentials, SellerData } from '../Model';

export class AuthRepository {
  private static instance: AuthRepository | null = null;

  public static getInstance(): AuthRepository {
    if (!AuthRepository.instance) {
      AuthRepository.instance = new AuthRepository();
    }
    return AuthRepository.instance;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errorMsg}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async login(credentials: LoginCredentials): Promise<SellerData> {
    const response = await fetch(`${API_URL_AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }

  async logout(): Promise<void> {
    await fetch(`${API_URL_AUTH}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async me(): Promise<SellerData> {
    const response = await fetch(`${API_URL_AUTH}/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return this.handleResponse(response);
  }
}
