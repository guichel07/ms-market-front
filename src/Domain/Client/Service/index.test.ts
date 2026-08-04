import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientService } from '.';
import { AnonymousClientBD, ClientBD } from '../IndexDB';
import { ClientRepository } from '../Repository';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { ClientDTO } from '../Model';

describe('ClientService', () => {
  const bd = {
    getAllClients: vi.fn(),
    saveClient: vi.fn(),
  };

  const anonymousBd = {
    getAllProfiles: vi.fn(),
    saveProfile: vi.fn(),
  };

  const repository = {
    getAll: vi.fn(),
    register: vi.fn(),
    getOrCreateAnonymous: vi.fn(),
  };

  const pendingClient: ClientDTO = { firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };
  const syncedClient: ClientDTO = { ...pendingClient, id: 'c1' };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    bd.getAllClients.mockResolvedValue([]);
    bd.saveClient.mockResolvedValue(undefined);
    anonymousBd.getAllProfiles.mockResolvedValue([]);
    anonymousBd.saveProfile.mockResolvedValue(undefined);
    vi.spyOn(ClientBD, 'getInstance').mockReturnValue(bd as unknown as ClientBD);
    vi.spyOn(AnonymousClientBD, 'getInstance').mockReturnValue(
      anonymousBd as unknown as AnonymousClientBD
    );
    vi.spyOn(ClientRepository, 'getInstance').mockReturnValue(
      repository as unknown as ClientRepository
    );
  });

  it('getAll synchronise les clients pending et récupère leur id assigné par le backend', async () => {
    bd.getAllClients.mockResolvedValue([
      { phone: pendingClient.phone, client: pendingClient, status: 'pending' },
    ]);
    repository.register.mockResolvedValue(syncedClient);
    repository.getAll.mockResolvedValue([syncedClient]);

    await ClientService.getInstance().getAll();

    expect(repository.register).toHaveBeenCalledWith(pendingClient);
    // Le client sauvegardé après sync DOIT être celui retourné par le backend (avec id),
    // pas le DTO de requête initial — sinon on ne peut jamais référencer ce client
    // dans une commande (clientId manquant).
    expect(bd.saveClient).toHaveBeenCalledWith(syncedClient, 'synced');
  });

  it('save enregistre en local immédiatement puis synchronise en tâche de fond', async () => {
    repository.register.mockResolvedValue(syncedClient);
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    await ClientService.getInstance().save(pendingClient);

    expect(bd.saveClient).toHaveBeenCalledWith(pendingClient, 'pending');
    expect(bd.saveClient).toHaveBeenCalledWith(syncedClient, 'synced');
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.ClientsUpdated, expect.anything());
  });

  it("save n'échoue pas si la synchro réseau échoue (offline-first)", async () => {
    repository.register.mockRejectedValue(new Error('offline'));

    await expect(ClientService.getInstance().save(pendingClient)).resolves.toBeUndefined();
    expect(bd.saveClient).toHaveBeenCalledWith(pendingClient, 'pending');
  });

  it('getAllAnonymousLocal délègue au cache local des profils anonymes', async () => {
    const profiles: ClientDTO[] = [
      { id: 'anon-1', firstname: 'Client anonyme', lastname: 'ENFANT HOMME', phone: '', ageCategory: 'ENFANT', gender: 'HOMME', anonymous: true },
    ];
    anonymousBd.getAllProfiles.mockResolvedValue(profiles);

    const result = await ClientService.getInstance().getAllAnonymousLocal();

    expect(result).toEqual(profiles);
  });

  it('syncAnonymousProfiles récupère les 6 profils et les met en cache, sans émettre ClientsUpdated', async () => {
    repository.getOrCreateAnonymous.mockImplementation((ageCategory: string, gender: string) =>
      Promise.resolve({
        id: `${ageCategory}-${gender}`,
        firstname: 'Client anonyme',
        lastname: `${ageCategory} ${gender}`,
        phone: '',
        ageCategory,
        gender,
        anonymous: true,
      })
    );
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    await ClientService.getInstance().syncAnonymousProfiles();

    expect(repository.getOrCreateAnonymous).toHaveBeenCalledTimes(6);
    expect(anonymousBd.saveProfile).toHaveBeenCalledTimes(6);
    expect(emitSpy).not.toHaveBeenCalledWith(AppEvent.ClientsUpdated, expect.anything());
  });

  it('syncAnonymousProfiles ne bloque pas si un profil échoue à se synchroniser', async () => {
    repository.getOrCreateAnonymous.mockRejectedValue(new Error('offline'));

    await expect(ClientService.getInstance().syncAnonymousProfiles()).resolves.toBeUndefined();
  });
});
