import { RecapSheet, type Customer, type RecapItem } from 'tek-ms-recap';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { ClientController } from '../../../Domain/Client/Controller';
import { ANONYMOUS_PROFILES, type ClientDTO } from '../../../Domain/Client/Model';
import { OrderState, type OrderSnapshot } from '../../../Domain/Order/State';

// tek-ms-recap ne connaît que {id, label} (anonymat total) — un client nommé
// n'existe plus, cf. ClientProfilePanel. Le `firstname` renvoyé par le back
// pour une fiche anonyme est un libellé générique ("Client anonyme"), pas le
// nom du profil : comme ClientProfilePanel, on retrouve le vrai libellé
// ("Garçon", "Femme"...) via ANONYMOUS_PROFILES, à partir d'ageCategory/gender.
function toRecapCustomer(client: ClientDTO): Customer {
  const profile = ANONYMOUS_PROFILES.find(
    (p) => p.ageCategory === client.ageCategory && p.gender === client.gender
  );
  return { id: client.id ?? '', label: profile?.label ?? client.firstname };
}

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
      // n'était en réalité jamais enregistrée (voir OrderController). Un
      // client pas encore synchronisé ne bloque plus la vente (voir
      // OrderService.registerLocal/syncPending) — seule l'absence totale de
      // client sélectionné est bloquante ici.
      window.alert("Impossible d'enregistrer la vente : sélectionnez d'abord un client.");
    });

    EventBus.getInstance().on(AppEvent.RecapStarted, async (payload) => {
      const snapshot = payload as OrderSnapshot;
      if (!snapshot?.items?.length) return;

      // Profils anonymes en cache, pas des clients nommés (voir
      // ClientProfilePanel) — permet de changer de profil sans quitter le récap.
      const profiles = await ClientController.getInstance().getAllAnonymousLocal();

      RecapViewManager.getInstance().render({
        items: snapshot.items as unknown as RecapItem[],
        customers: profiles.map(toRecapCustomer),
        defaultCustomer: snapshot.clientSelected ? toRecapCustomer(snapshot.clientSelected) : null,
        onCancel: (items) => {
          // items reflète les suppressions faites DANS le récap (bouton ✕ de
          // RecapSheet) — sans cette synchro, un article retiré ici "revenait"
          // dans le panier au retour à SELLING (Basket jamais informé).
          EventBus.getInstance().emit(AppEvent.CartSyncedFromRecap, items);
          OrderState.getInstance().transitionTo('SELLING');
          RecapViewManager.getInstance().onClose();
        },
        onConfirm: (items) => {
          EventBus.getInstance().emit(AppEvent.SaleConfirmed, items);
          // Fermeture différée : voir listeners SaleRegistered/SaleRejected
          // ci-dessus, on ne ferme plus tant qu'on ne sait pas si ça a réussi.
        },
        // RecapSheet ne renvoie que {id, label} — on retrouve la fiche
        // complète (ageCategory/gender/id réel) pour rester cohérent avec ce
        // qu'émet ClientProfilePanel via ce même événement.
        selectedCustomer: (customer: Customer) => {
          const client = profiles.find((c) => c.id === customer.id);
          if (client) EventBus.getInstance().emit(AppEvent.OnSelectCustomer, client);
        },
      });
    });
  }
}
