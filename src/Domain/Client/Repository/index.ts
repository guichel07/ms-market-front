import { API_URL_CLIENTS } from '../../../constants';
import type { ClientDTO } from '../Model';

export class ClientRepository {
  private static instance: ClientRepository | null = null;

  public static getInstance(): ClientRepository {
    if (!ClientRepository.instance) {
      ClientRepository.instance = new ClientRepository();
    }
    return ClientRepository.instance;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      throw new Error(`Erreur API (${response.status}): ${await response.text()}`);
    }
    return response.json();
  }

  async getAll(): Promise<ClientDTO[]> {
    const response = await fetch(`${API_URL_CLIENTS}`, {
      method: 'GET',
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  /** Retourne le ClientDTO créé, avec son id assigné par le backend. */
  async register(clientDTO: ClientDTO): Promise<ClientDTO> {
    const response = await fetch(`${API_URL_CLIENTS}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientDTO),
    });
    return this.handleResponse(response);
  }
}
