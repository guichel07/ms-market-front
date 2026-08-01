import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../Service';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { LoginCredentials } from '../Model';
import { AuthController } from '.';

describe('AuthController', () => {
  const authService = {
    login: vi.fn(),
    logout: vi.fn(),
    getLocalSession: vi.fn(),
    refreshSession: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    vi.spyOn(AuthService, 'getInstance').mockReturnValue(
      authService as unknown as AuthService
    );
  });

  it('retourne toujours la même instance', () => {
    expect(AuthController.getInstance()).toBe(AuthController.getInstance());
  });

  it('login délègue au service', async () => {
    const credentials: LoginCredentials = { email: 'a@a.com', password: 'secret' };
    await AuthController.getInstance().login(credentials);

    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('init: Disconnected déclenche un logout', () => {
    AuthController.init();

    EventBus.getInstance().emit(AppEvent.Disconnected, undefined);

    expect(authService.logout).toHaveBeenCalled();
  });

  it('getLocalSession délègue au service', async () => {
    await AuthController.getInstance().getLocalSession();

    expect(authService.getLocalSession).toHaveBeenCalled();
  });

  it('refreshSession délègue au service', async () => {
    await AuthController.getInstance().refreshSession();

    expect(authService.refreshSession).toHaveBeenCalled();
  });
});
