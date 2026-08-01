import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '.';
import { AuthRepository } from '../Repository';
import { AuthBD } from '../IndexDB';
import type { SellerData, LoginCredentials } from '../Model';

describe('AuthService', () => {
  const repository = {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  };

  const authBD = {
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    getSession: vi.fn(),
  };

  const seller: SellerData = {
    id: 1,
    email: 'a@a.com',
    name: 'Awa',
    tag: 'AW01',
    role: 'SELLER',
    svgAvatar: '',
    contact: '0700000000',
    active: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthRepository, 'getInstance').mockReturnValue(
      repository as unknown as AuthRepository
    );
    vi.spyOn(AuthBD, 'getInstance').mockReturnValue(authBD as unknown as AuthBD);
  });

  it('login sauvegarde la session localement et retourne le vendeur', async () => {
    repository.login.mockResolvedValue(seller);

    const credentials: LoginCredentials = { email: 'a@a.com', password: 'secret' };
    const result = await AuthService.getInstance().login(credentials);

    expect(repository.login).toHaveBeenCalledWith(credentials);
    expect(authBD.saveSession).toHaveBeenCalledWith(seller);
    expect(result).toEqual(seller);
  });

  it('logout efface le cache local même si le réseau échoue', async () => {
    repository.logout.mockRejectedValue(new Error('offline'));

    await expect(AuthService.getInstance().logout()).rejects.toThrow('offline');
    expect(authBD.clearSession).toHaveBeenCalled();
  });

  it('refreshSession revalide auprès du backend et met à jour le cache', async () => {
    repository.me.mockResolvedValue(seller);

    const result = await AuthService.getInstance().refreshSession();

    expect(authBD.saveSession).toHaveBeenCalledWith(seller);
    expect(result).toEqual(seller);
  });

  it('getLocalSession lit uniquement le cache offline', async () => {
    authBD.getSession.mockResolvedValue(seller);

    const result = await AuthService.getInstance().getLocalSession();

    expect(result).toEqual(seller);
  });
});
