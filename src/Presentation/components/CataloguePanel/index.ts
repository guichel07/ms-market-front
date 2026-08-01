import { ClientBar } from 'ms-clientbar';
import type { Customer } from 'ms-clientbar/dist/clientBar';
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
import type { ClientDTO } from '../../../Domain/Client/Model';
import { OrderState } from '../../../Domain/Order/State';

/**
 * Façade unique qui possède ClientBar + Tabbar + Basket + AddSheet + Catalogue.
 * Ces 5 composants partagent exactement le même cycle de vie (montés au
 * login, détruits au logout) et forment ensemble l'état SELLING — les
 * regrouper ici évite d'avoir 5 listeners Connected/Disconnected dupliqués
 * comme c'était le cas quand chacun était un ViewManager indépendant.
 */
export class CataloguePanel {
  private static instance: CataloguePanel | null = null;

  private clientBar: ClientBar | null = null;
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
    this.clientBar = new ClientBar(this.requireEl('#container-client-bar'));
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
    this.clientBar = null;
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

  private async renderClientBar(): Promise<void> {
    this.clientBar?.render({
      customers: await ClientController.getInstance().getAllLocal(),
      callback: (customer) => {
        ClientController.getInstance().save(customer as ClientDTO);
      },
      selectedCustomer: (customer: Customer) => {
        EventBus.getInstance().emit(AppEvent.OnSelectCustomer, customer);
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
        await ArticleController.getInstance().adjustStockLocally(cartItem.id, cartItem.quantity);
        this.catalog?.updateArticleQuantity(cartItem.id, cartItem.quantity);
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
        onConfirm: (price: number, qty: number) => {
          EventBus.getInstance().emit(AppEvent.AddSheetValided, { ...article, price, qty });
          this.addSheet?.close();
        },
        onCancel: () => {
          this.addSheet?.close();
        },
      });
    });

    EventBus.getInstance().on(AppEvent.AddSheetValided, async (payload) => {
      const data = payload as ArticleDTO & { price: number; qty: number };
      await ArticleController.getInstance().adjustStockLocally(data.id, -data.qty);
      this.catalog?.updateArticleQuantity(data.id, -data.qty);
      this.basket?.addToCart({ ...data, quantity: data.qty } as CartItem);
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
      }
      this.renderClientBar();
    });

    EventBus.getInstance().on(AppEvent.SaleRegistered, () => {
      this.basket?.resetItems();
      this.tabbar?.updateCartCount(-this.cartCount);
      this.cartCount = 0;
    });

    EventBus.getInstance().on(AppEvent.ClientsUpdated, () => {
      this.renderClientBar();
    });
  }

  /** Appelé une seule fois au bootstrap (voir main.ts) — enregistre les listeners une fois pour toutes. */
  static init(): void {
    const panel = CataloguePanel.getInstance();
    panel.wireCrossComponentEvents();

    EventBus.getInstance().on(AppEvent.Disconnected, () => {
      panel.reset();
    });

    EventBus.getInstance().on(AppEvent.Connected, () => {
      panel.mount();
      panel.renderTabbar();
      panel.renderBasket();
      panel.renderClientBar();
      panel.renderCatalogue();
    });
  }
}
