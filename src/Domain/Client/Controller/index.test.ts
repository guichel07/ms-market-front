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
});
