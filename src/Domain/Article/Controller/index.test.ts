import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleController } from '.';
import { ArticleService } from '../Service';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';

describe('ArticleController', () => {
  const service = {
    syncArticles: vi.fn(),
    getLocalAll: vi.fn(),
    getLocalById: vi.fn(),
    adjustStockLocally: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    vi.spyOn(ArticleService, 'getInstance').mockReturnValue(
      service as unknown as ArticleService
    );
  });

  it('retourne toujours la même instance', () => {
    expect(ArticleController.getInstance()).toBe(ArticleController.getInstance());
  });

  it('init: Connected déclenche une synchro des articles', () => {
    ArticleController.init();

    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    expect(service.syncArticles).toHaveBeenCalled();
  });

  it('adjustStockLocally délègue au service', async () => {
    await ArticleController.getInstance().adjustStockLocally('a1', -1);

    expect(service.adjustStockLocally).toHaveBeenCalledWith('a1', -1);
  });
});
