import { API_URL_ORDERS } from '../../../constants';
import type { OrderDTO } from '../Model';

export class OrderRepository {
  private static instance: OrderRepository | null = null;

  public static getInstance(): OrderRepository {
    if (!OrderRepository.instance) {
      OrderRepository.instance = new OrderRepository();
    }
    return OrderRepository.instance;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      throw new Error(`Erreur API (${response.status}): ${await response.text()}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async getAll() {
    const response = await fetch(`${API_URL_ORDERS}`, {
      method: 'GET',
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async register(orderDTO: OrderDTO) {
    const response = await fetch(`${API_URL_ORDERS}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderDTO),
    });
    return this.handleResponse(response);
  }

  /** GET /orders/total-today?email=... — le backend attend un query param, pas un path param. */
  async getTotalSoldToday(email: string): Promise<number> {
    const response = await fetch(
      `${API_URL_ORDERS}/total-today?email=${encodeURIComponent(email)}`,
      { method: 'GET', credentials: 'include' }
    );
    return this.handleResponse(response);
  }
}
