import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientController } from '.';
import { ClientService } from '../Service';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';

describe('ClientController', () => {
  const service = {
    getAll: vi.fn(),
    getAllLocal: vi.fn(),
    save: vi.fn(),
    getAllAnonymousLocal: vi.fn(),
    syncAnonymousProfiles: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    vi.spyOn(ClientService, 'getInstance').mockReturnValue(
      service as unknown as ClientService
    );
  });

  it('retourne toujours la même instance', () => {
    expect(ClientController.getInstance()).toBe(ClientController.getInstance());
  });

  it('init: Connected déclenche une synchro des clients', () => {
    ClientController.init();

    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    expect(service.getAll).toHaveBeenCalled();
  });

  it("init: Connected ne synchronise PAS les profils anonymes (délégué à CataloguePanel, qui doit attendre le résultat)", () => {
    ClientController.init();

    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    expect(service.syncAnonymousProfiles).not.toHaveBeenCalled();
  });

  it('getAllAnonymousLocal délègue au service', async () => {
    service.getAllAnonymousLocal.mockResolvedValue([]);

    await ClientController.getInstance().getAllAnonymousLocal();

    expect(service.getAllAnonymousLocal).toHaveBeenCalled();
  });

  it('syncAnonymousProfiles délègue au service', async () => {
    service.syncAnonymousProfiles.mockResolvedValue(undefined);

    await ClientController.getInstance().syncAnonymousProfiles();

    expect(service.syncAnonymousProfiles).toHaveBeenCalled();
  });
});
