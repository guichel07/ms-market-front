import { RecapSheet, type Customer, type RecapItem } from 'tek-ms-recap';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { ClientController } from '../../../Domain/Client/Controller';
import type { ClientDTO } from '../../../Domain/Client/Model';
import { OrderState, type OrderSnapshot } from '../../../Domain/Order/State';

export class RecapViewManager extends RecapSheet {
  private static instance: RecapViewManager | null = null;

  public static getInstance() {
    if (!RecapViewManager.instance) {
      const el = document.querySelector<HTMLDivElement>('#container-recap-overlay');
      if (!el) throw new Error('#container-recap-overlay introuvable dans le DOM');
      RecapViewManager.instance = new RecapViewManager(el);
    }
    return RecapViewManager.instance;
  }

  static reset() {
    RecapViewManager.instance = null;
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      RecapViewManager.reset();
    });

    EventBus.getInstance().on(AppEvent.SaleRegistered, () => {
      RecapViewManager.getInstance().onClose();
    });

    EventBus.getInstance().on(AppEvent.SaleRejected, () => {
      // Le récap reste ouvert : fermer ici sans confirmation de succès causait
      // le "retour à selling" perçu par l'utilisateur alors que la vente
      // n'était en réalité jamais enregistrée (voir OrderController).
      window.alert(
        "Impossible d'enregistrer la vente : le client sélectionné est en attente de synchronisation. Réessayez dans quelques secondes."
      );
    });

    EventBus.getInstance().on(AppEvent.RecapStarted, async (payload) => {
      const snapshot = payload as OrderSnapshot;
      if (!snapshot?.items?.length) return;

      RecapViewManager.getInstance().render({
        items: snapshot.items as unknown as RecapItem[],
        customers: await ClientController.getInstance().getAllLocal(),
        defaultCustomer: snapshot.clientSelected as Customer | null,
        onCancel: () => {
          OrderState.getInstance().transitionTo('SELLING');
          RecapViewManager.getInstance().onClose();
        },
        onConfirm: (items) => {
          EventBus.getInstance().emit(AppEvent.SaleConfirmed, items);
          // Fermeture différée : voir listeners SaleRegistered/SaleRejected
          // ci-dessus, on ne ferme plus tant qu'on ne sait pas si ça a réussi.
        },
        onSaveCustomer: (customer: Customer) => {
          ClientController.getInstance().save(customer as ClientDTO);
        },
        selectedCustomer: (customer: Customer) => {
          EventBus.getInstance().emit(AppEvent.OnSelectCustomer, customer);
        },
      });
    });
  }
}
