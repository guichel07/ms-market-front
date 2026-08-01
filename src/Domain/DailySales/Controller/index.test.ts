import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DailySalesController } from '.';
import { DailySalesService } from '../Service';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';

describe('DailySalesController', () => {
  const service = { getTodayTotal: vi.fn(), addToTodayTotal: vi.fn() };

  beforeEach(() => {
    vi.restoreAllMocks();
    EventBus.getInstance().clear();
    vi.spyOn(DailySalesService, 'getInstance').mockReturnValue(
      service as unknown as DailySalesService
    );
  });

  it('addToTodayTotal émet DailyTotalChanged avec le nouveau total', async () => {
    service.addToTodayTotal.mockResolvedValue(1500);
    const emitSpy = vi.spyOn(EventBus.getInstance(), 'emit');

    const result = await DailySalesController.getInstance().addToTodayTotal(500);

    expect(result).toBe(1500);
    expect(emitSpy).toHaveBeenCalledWith(AppEvent.DailyTotalChanged, 1500);
  });
});
