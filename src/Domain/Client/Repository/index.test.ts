import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientRepository } from '.';
import { API_URL_CLIENTS } from '../../../constants';
import type { ClientDTO } from '../Model';

describe('ClientRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retourne toujours la même instance', () => {
    expect(ClientRepository.getInstance()).toBe(ClientRepository.getInstance());
  });

  it('getAll appelle GET /clients', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

    await ClientRepository.getInstance().getAll();

    expect(fetch).toHaveBeenCalledWith(
      API_URL_CLIENTS,
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
  });

  it('register retourne le client créé avec son id assigné par le backend', async () => {
    const request: ClientDTO = { firstname: 'Awa', lastname: 'Diop', phone: '0700000000' };
    const created = { ...request, id: 'c1' };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => created,
    } as Response);

    const result = await ClientRepository.getInstance().register(request);

    expect(fetch).toHaveBeenCalledWith(
      API_URL_CLIENTS,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(request),
      })
    );
    expect(result).toEqual(created);
  });
});
