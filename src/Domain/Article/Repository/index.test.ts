import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleRepository } from '.';
import { API_URL_ARTICLES } from '../../../constants';

describe('ArticleRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retourne toujours la même instance', () => {
    expect(ArticleRepository.getInstance()).toBe(ArticleRepository.getInstance());
  });

  it('getAll appelle GET /articles avec les cookies inclus', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'a1' }],
    } as unknown as Response);

    const result = await ArticleRepository.getInstance().getAll();

    expect(fetch).toHaveBeenCalledWith(
      API_URL_ARTICLES,
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('getAll lève une erreur si la réponse échoue', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    } as Response);

    await expect(ArticleRepository.getInstance().getAll()).rejects.toThrow(
      'Erreur API (500): boom'
    );
  });
});
