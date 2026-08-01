import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRepository } from '.';
import { API_URL_AUTH } from '../../../constants';
import type { LoginCredentials } from '../Model';

describe('AuthRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retourne toujours la même instance', () => {
    expect(AuthRepository.getInstance()).toBe(AuthRepository.getInstance());
  });

  it('login poste les identifiants avec les cookies inclus', async () => {
    const credentials: LoginCredentials = { email: 'a@a.com', password: 'secret' };
    const mockResponse = { ok: true, text: async () => JSON.stringify({ id: 1 }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await AuthRepository.getInstance().login(credentials);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL_AUTH}/login`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
    );
    expect(result).toEqual({ id: 1 });
  });

  it('login lève une erreur si la réponse est en échec', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Bad password',
    } as Response);

    await expect(
      AuthRepository.getInstance().login({ email: 'a@a.com', password: 'bad' })
    ).rejects.toThrow('Erreur API (401): Bad password');
  });

  it('logout appelle POST /logout avec les cookies inclus', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '' } as Response);

    await AuthRepository.getInstance().logout();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL_AUTH}/logout`,
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('me retourne les infos du vendeur connecté', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 1, email: 'a@a.com' }),
    } as Response);

    const result = await AuthRepository.getInstance().me();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL_AUTH}/me`,
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
    expect(result).toEqual({ id: 1, email: 'a@a.com' });
  });
});
