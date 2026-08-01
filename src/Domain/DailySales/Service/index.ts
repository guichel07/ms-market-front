import { DailySalesBD } from '../IndexDB';

export class DailySalesService {
  private static instance: DailySalesService | null = null;

  private constructor() {}

  public static getInstance(): DailySalesService {
    if (!DailySalesService.instance) {
      DailySalesService.instance = new DailySalesService();
    }
    return DailySalesService.instance;
  }

  async getTodayTotal(): Promise<number> {
    return DailySalesBD.getInstance().getTodayTotal();
  }

  async addToTodayTotal(amount: number): Promise<number> {
    return DailySalesBD.getInstance().addToTodayTotal(amount);
  }
}
