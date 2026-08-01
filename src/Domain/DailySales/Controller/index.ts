import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import { DailySalesService } from '../Service';

export class DailySalesController {
  private static instance: DailySalesController | null = null;

  private constructor() {}

  public static getInstance(): DailySalesController {
    if (!DailySalesController.instance) {
      DailySalesController.instance = new DailySalesController();
    }
    return DailySalesController.instance;
  }

  async getTodayTotal(): Promise<number> {
    return DailySalesService.getInstance().getTodayTotal();
  }

  async addToTodayTotal(amount: number): Promise<number> {
    const newTotal = await DailySalesService.getInstance().addToTodayTotal(amount);
    EventBus.getInstance().emit(AppEvent.DailyTotalChanged, newTotal);
    return newTotal;
  }
}
