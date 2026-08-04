import { ReceiptQR } from 'ms-rq';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import type { RecapItem } from 'tek-ms-recap';
import type { ClientDTO } from '../../../Domain/Client/Model';

export class RqViewManager extends ReceiptQR {
  private static instance: RqViewManager | null = null;
  private static readonly TICKET_KEY = 'last-ticket-number';
  // AppEvent.OnSelectCustomer transporte toujours la fiche complète (ClientDTO),
  // pas le {id,label} réduit de tek-ms-recap (voir RecapViewManager/CataloguePanel).
  private customer: ClientDTO | null = null;
  private items: RecapItem[] = [];

  public static getInstance() {
    if (!RqViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#container-qr-overlay');
      if (!el) throw new Error('#container-qr-overlay introuvable dans le DOM');
      RqViewManager.instance = new RqViewManager(el);
    }
    return RqViewManager.instance;
  }

  static reset() {
    RqViewManager.instance = null;
  }

  /** Numéro de ticket incrémental, persisté pour survivre au rechargement. */
  private static nextTicketNumber(): string {
    const last = parseInt(localStorage.getItem(RqViewManager.TICKET_KEY) ?? '0', 10);
    const next = last + 1;
    localStorage.setItem(RqViewManager.TICKET_KEY, String(next));
    return String(next).padStart(5, '0');
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      RqViewManager.reset();
    });

    EventBus.getInstance().on(AppEvent.OnSelectCustomer, (payload) => {
      RqViewManager.getInstance().customer = payload as ClientDTO;
    });

    EventBus.getInstance().on(AppEvent.SaleConfirmed, (payload) => {
      RqViewManager.getInstance().items = payload as RecapItem[];
    });

    EventBus.getInstance().on(AppEvent.ConfirmationClickRecu, () => {
      const instance = RqViewManager.getInstance();
      instance.render({
        receipt: {
          ticketNumber: RqViewManager.nextTicketNumber(),
          customerName: instance.customer?.firstname,
          customerPhone: instance.customer?.phone,
          storeName: 'MAMAN SOLUTION',
          date: new Date(),
          items: instance.items,
        },
      });
    });
  }
}
