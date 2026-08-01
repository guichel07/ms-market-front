import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import { ClientBD } from '../IndexDB';
import type { ClientDTO } from '../Model';
import { ClientRepository } from '../Repository';

export class ClientService {
  private static instance: ClientService | null = null;

  public static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService();
    }
    return ClientService.instance;
  }

  private async notifyUpdated(): Promise<void> {
    const clients = (await ClientBD.getInstance().getAllClients()).map((c) => c.client);
    EventBus.getInstance().emit(AppEvent.ClientsUpdated, clients);
  }

  async getAllLocal(): Promise<ClientDTO[]> {
    return (await ClientBD.getInstance().getAllClients()).map((c) => c.client);
  }

  private async getAllPending(): Promise<ClientDTO[]> {
    return (await ClientBD.getInstance().getAllClients())
      .filter((c) => c.status === 'pending')
      .map((c) => c.client);
  }

  /**
   * Pousse les clients créés hors-ligne vers le backend (ce qui leur assigne
   * un id réel — indispensable pour référencer ce client dans une commande),
   * puis rafraîchit le cache local avec la liste serveur à jour.
   */
  async getAll(): Promise<ClientDTO[]> {
    await Promise.all(
      (await this.getAllPending()).map((pending) =>
        ClientRepository.getInstance()
          .register(pending)
          .then((synced) => ClientBD.getInstance().saveClient(synced, 'synced'))
          .catch((e) => console.error(e))
      )
    );

    const clients = await ClientRepository.getInstance().getAll();
    await Promise.all(
      clients.map((c) =>
        ClientBD.getInstance()
          .saveClient(c, 'synced')
          .catch((e) => console.error(e))
      )
    );
    await this.notifyUpdated();
    return clients;
  }

  /** Sauvegarde immédiate en local (UI réactive), synchro backend en tâche de fond. */
  async save(client: ClientDTO): Promise<void> {
    await ClientBD.getInstance().saveClient(client, 'pending');
    await this.notifyUpdated();

    try {
      const synced = await ClientRepository.getInstance().register(client);
      await ClientBD.getInstance().saveClient(synced, 'synced');
      await this.notifyUpdated();
    } catch (e) {
      console.error(e);
    }
  }
}
