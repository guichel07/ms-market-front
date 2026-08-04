import { Tabbar } from 'tek-ms-tabbar';
import { Basket, type CartItem } from 'tek-ms-barket';
import { AddSheet } from 'tek-ms-addsheet';
import type { AddSheetProduct } from 'tek-ms-addsheet/dist/AddSheet';
import { Catalog } from 'tek-ms-catalog';
import type { Article } from 'tek-ms-catalog/dist/model';
import { AppEvent } from '../../../constants';
import { EventBus } from '../../../EventBus';
import { ArticleController } from '../../../Domain/Article/Controller';
import type { ArticleDTO } from '../../../Domain/Article/Model';
import { ClientController } from '../../../Domain/Client/Controller';
import { OrderState } from '../../../Domain/Order/State';
import { ClientProfilePanel } from '../ClientProfilePanel';

/**
 * Façade unique qui possède ClientProfilePanel + Tabbar + Basket + AddSheet + Catalogue.
 * Ces 5 composants partagent exactement le même cycle de vie (montés au
 * login, détruits au logout) et forment ensemble l'état SELLING — les
 * regrouper ici évite d'avoir 5 listeners Connected/Disconnected dupliqués
 * comme c'était le cas quand chacun était un ViewManager indépendant.
 */
export class CataloguePanel {
  private static instance: CataloguePanel | null = null;

  private clientProfilePanel: ClientProfilePanel | null = null;
  private tabbar: Tabbar | null = null;
  private basket: Basket | null = null;
  private addSheet: AddSheet | null = null;
  private catalog: Catalog | null = null;
  private cartCount = 0;

  private constructor() {}

  public static getInstance(): CataloguePanel {
    if (!CataloguePanel.instance) {
      CataloguePanel.instance = new CataloguePanel();
    }
    return CataloguePanel.instance;
  }

  private mount(): void {
    this.clientProfilePanel = new ClientProfilePanel(this.requireEl('#container-client-bar'));
    this.tabbar = new Tabbar(this.requireEl('#screen-tabbar'));
    this.basket = new Basket(this.requireEl('#panel-cart-contenair'));
    this.addSheet = new AddSheet(this.requireEl('#add-overlay-container'));
    this.catalog = new Catalog(this.requireEl('#container-catalogue-page'));
  }

  private requireEl(selector: string): HTMLElement {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`${selector} introuvable dans le DOM`);
    return el;
  }

  private reset(): void {
    this.clientProfilePanel = null;
    this.tabbar = null;
    this.basket = null;
    this.addSheet = null;
    this.catalog = null;
    this.cartCount = 0;
  }

  /** Rafraîchit le catalogue depuis le backend (déclenche ArticlesSynced en interne). */
  async sync(): Promise<void> {
    await ArticleController.getInstance().syncArticles();
  }

  private async renderClientProfilePanel(): Promise<void> {
    this.clientProfilePanel?.render({
      profiles: await ClientController.getInstance().getAllAnonymousLocal(),
      onSelect: (client) => {
        EventBus.getInstance().emit(AppEvent.OnSelectCustomer, client);
      },
    });
  }

  private async renderCatalogue(): Promise<void> {
    const articles = await ArticleController.getInstance().getLocalAll();
    const categories = ['Tous', ...new Set(articles.map((article) => article.category))];
    this.catalog?.render({
      categories,
      produits: articles as unknown as Article[],
      callback: (article) => {
        EventBus.getInstance().emit(AppEvent.ArticleClicked, article);
      },
    });
  }

  private renderTabbar(): void {
    this.cartCount = 0;
    this.tabbar?.render({
      pageLabel: 'Catalogue',
      cartLabel: 'Panier',
      cartCount: 0,
      showTab: () => {},
      onclickPanier: () => {
        document.body.querySelector('#panel-products')?.classList.remove('visible');
        document.body.querySelector('#panel-cart')?.classList.add('visible');
      },
      onclickPage: () => {
        document.body.querySelector('#panel-cart')?.classList.remove('visible');
        document.body.querySelector('#panel-products')?.classList.add('visible');
      },
    });
  }

  private renderBasket(): void {
    this.basket?.render({
      receiptNumber: '00482',
      receiptDate: new Date().toISOString(),
      onClickValidation: () => {
        OrderState.getInstance().transitionTo('RECAP', {
          items: this.basket?.getItems() ?? [],
          clientSelected: OrderState.getInstance().getClientSelected(),
        });
      },
      onClickRemoveCard: async (cartItem: CartItem) => {
        // Restituer le bon nombre d'unités atomiques : retirer "1 Carton de 12"
        // du panier doit rendre 12 unités de stock, pas 1 (même logique de
        // ratio qu'à l'ajout, voir AddSheetValided ci-dessous).
        const article = await ArticleController.getInstance().getLocalById(cartItem.id);
        const ratio = cartItem.soldAsLabel
          ? (article?.packagingLevels.find((l) => l.label === cartItem.soldAsLabel)?.ratio ?? 1)
          : 1;
        const updated = await ArticleController.getInstance().adjustStockLocally(
          cartItem.id,
          cartItem.quantity * ratio
        );
        if (updated) this.catalog?.updateArticleQuantity(cartItem.id, updated.quantity);
        this.cartCount -= cartItem.quantity;
        this.tabbar?.updateCartCount(-cartItem.quantity);
        EventBus.getInstance().emit(AppEvent.CartItemRemoved, cartItem);
      },
    });
  }

  private wireCrossComponentEvents(): void {
    EventBus.getInstance().on(AppEvent.ArticleClicked, (payload) => {
      const article = payload as ArticleDTO;
      this.addSheet?.render({
        product: article as unknown as AddSheetProduct,
        onConfirm: (price: number, qty: number, _belowFloor: boolean, soldAsLabel: string | null) => {
          EventBus.getInstance().emit(AppEvent.AddSheetValided, {
            ...article,
            price,
            qty,
            soldAsLabel: soldAsLabel ?? undefined,
          });
          this.addSheet?.close();
        },
        onCancel: () => {
          this.addSheet?.close();
        },
      });
    });

    EventBus.getInstance().on(AppEvent.AddSheetValided, async (payload) => {
      const data = payload as ArticleDTO & { price: number; qty: number; soldAsLabel?: string };
      // Le stock (toujours en unités atomiques) doit baisser de qty × ratio du
      // palier choisi, pas de qty brut — 1 "Carton de 12" décrémente 12 unités
      // atomiques, pas 1 (voir OrderServiceImpl.resolveSoldAsRatio côté back,
      // même principe ici pour que l'affichage local reste juste avant même
      // l'enregistrement de la vente).
      const ratio = data.soldAsLabel
        ? (data.packagingLevels.find((l) => l.label === data.soldAsLabel)?.ratio ?? 1)
        : 1;
      const updated = await ArticleController.getInstance().adjustStockLocally(
        data.id,
        -data.qty * ratio
      );
      if (updated) this.catalog?.updateArticleQuantity(data.id, updated.quantity);
      this.basket?.addToCart({
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        category: data.category,
        price: data.price,
        quantity: data.qty,
        atomicUnit: data.atomicUnit,
        soldAsLabel: data.soldAsLabel,
      } as CartItem);
      this.cartCount += data.qty;
      this.tabbar?.updateCartCount(data.qty);
    });

    EventBus.getInstance().on(AppEvent.ArticlesSynced, () => {
      this.renderCatalogue();
    });

    EventBus.getInstance().on(AppEvent.SellingStarted, (payload) => {
      const { resetClient } = payload as { resetClient: boolean };
      if (resetClient) {
        this.basket?.resetItems();
        this.cartCount = 0;
        this.tabbar?.updateCartCount(0);
        // render() seul ne réinitialise pas l'affichage du profil précédent —
        // sans ça la barre montre encore le profil de la vente qui vient
        // d'être confirmée.
        this.clientProfilePanel?.clearSelection();
      }
      this.renderClientProfilePanel();
    });

    EventBus.getInstance().on(AppEvent.SaleRegistered, () => {
      this.basket?.resetItems();
      this.tabbar?.updateCartCount(-this.cartCount);
      this.cartCount = 0;
    });

    EventBus.getInstance().on(AppEvent.ClientsUpdated, () => {
      this.renderClientProfilePanel();
    });

    EventBus.getInstance().on(AppEvent.CartSyncedFromRecap, (payload) => {
      // items retirés DANS le récap (bouton ✕ de RecapSheet) puis annulation —
      // sans ça le Basket (jamais informé de ces suppressions) réaffichait
      // encore ces articles au retour à SELLING.
      const remainingIds = new Set((payload as { id: string }[]).map((item) => item.id));
      const synced = (this.basket?.getItems() ?? []).filter((item) => remainingIds.has(item.id));
      this.basket?.setItems(synced);
      const newCount = synced.reduce((total, item) => total + item.quantity, 0);
      this.tabbar?.updateCartCount(newCount - this.cartCount);
      this.cartCount = newCount;
    });
  }

  /** Appelé une seule fois au bootstrap (voir main.ts) — enregistre les listeners une fois pour toutes. */
  static init(): void {
    const panel = CataloguePanel.getInstance();
    panel.wireCrossComponentEvents();

    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      panel.reset();
    });

    EventBus.getInstance().on(AppEvent.Connected, async () => {
      panel.mount();
      panel.renderTabbar();
      panel.renderBasket();
      // Attend la synchro pour que les boutons profil disposent d'emblée d'un
      // id backend réel — un premier render avec un cache encore vide rendrait
      // les boutons inertes tant que ClientsUpdated ne re-render pas ailleurs.
      await ClientController.getInstance().syncAnonymousProfiles();
      panel.renderClientProfilePanel();
      panel.renderCatalogue();
    });
  }
}
