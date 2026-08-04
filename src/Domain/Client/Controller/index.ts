import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import type { ClientDTO } from '../Model';
import { ClientService } from '../Service';

export class ClientController {
  private static instance: ClientController | null = null;

  public static getInstance(): ClientController {
    if (!ClientController.instance) {
      ClientController.instance = new ClientController();
    }
    return ClientController.instance;
  }

  static init(): void {
    // syncAnonymousProfiles est déclenché par CataloguePanel (pas ici) : il doit
    // être attendu avant le premier render des boutons profil, ce qu'un listener
    // Connected indépendant ne peut pas garantir.
    EventBus.getInstance().on(AppEvent.Connected, () => {
      ClientController.getInstance().getAll();
    });
  }

  async getAll(): Promise<ClientDTO[]> {
    return ClientService.getInstance().getAll();
  }

  async getAllLocal(): Promise<ClientDTO[]> {
    return ClientService.getInstance().getAllLocal();
  }

  async save(client: ClientDTO): Promise<void> {
    return ClientService.getInstance().save(client);
  }

  async getAllAnonymousLocal(): Promise<ClientDTO[]> {
    return ClientService.getInstance().getAllAnonymousLocal();
  }

  async syncAnonymousProfiles(): Promise<void> {
    return ClientService.getInstance().syncAnonymousProfiles();
  }
}
