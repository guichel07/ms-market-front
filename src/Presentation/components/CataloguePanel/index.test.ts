/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CataloguePanel } from '.';
import { EventBus } from '../../../EventBus';
import { AppEvent } from '../../../constants';
import { ArticleController } from '../../../Domain/Article/Controller';
import { ClientController } from '../../../Domain/Client/Controller';
import { Basket } from 'tek-ms-barket';
import { Tabbar } from 'tek-ms-tabbar';
import { AddSheet } from 'tek-ms-addsheet';
import { Catalog } from 'tek-ms-catalog';
import { ClientProfilePanel } from '../ClientProfilePanel';

describe('CataloguePanel', () => {
  const articleController = {
    getLocalAll: vi.fn().mockResolvedValue([]),
    getLocalById: vi.fn().mockResolvedValue(null),
    adjustStockLocally: vi.fn().mockResolvedValue(null),
    syncArticles: vi.fn().mockResolvedValue(undefined),
  };
  const clientController = {
    getAllLocal: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    getAllAnonymousLocal: vi.fn().mockResolvedValue([]),
    syncAnonymousProfiles: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="screen-tabbar"></div>
      <div id="container-client-bar"></div>
      <div id="panel-cart-contenair"></div>
      <div id="add-overlay-container"></div>
      <div id="container-catalogue-page"></div>
      <div id="panel-products" class="visible"></div>
      <div id="panel-cart"></div>
    `;
    (CataloguePanel as unknown as { instance: CataloguePanel | null }).instance = null;
    EventBus.getInstance().clear();
    vi.restoreAllMocks();
    vi.spyOn(ArticleController, 'getInstance').mockReturnValue(
      articleController as unknown as ArticleController
    );
    vi.spyOn(ClientController, 'getInstance').mockReturnValue(
      clientController as unknown as ClientController
    );
  });

  it('retourne toujours la même instance', () => {
    expect(CataloguePanel.getInstance()).toBe(CataloguePanel.getInstance());
  });

  it('Connected monte et rend les 5 composants embarqués', async () => {
    const renderBasket = vi.spyOn(Basket.prototype, 'render');
    const renderTabbar = vi.spyOn(Tabbar.prototype, 'render');
    const renderClientProfilePanel = vi.spyOn(ClientProfilePanel.prototype, 'render');
    const renderCatalog = vi.spyOn(Catalog.prototype, 'render');

    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renderBasket).toHaveBeenCalled();
    expect(renderTabbar).toHaveBeenCalled();
    expect(renderClientProfilePanel).toHaveBeenCalled();
    expect(renderCatalog).toHaveBeenCalled();
    expect(clientController.syncAnonymousProfiles).toHaveBeenCalled();
  });

  it('sync() délègue à ArticleController.syncArticles', async () => {
    await CataloguePanel.getInstance().sync();

    expect(articleController.syncArticles).toHaveBeenCalled();
  });

  it('ArticleClicked ouvre AddSheet avec le produit', () => {
    const renderAddSheet = vi.spyOn(AddSheet.prototype, 'render');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.ArticleClicked, {
      id: 'a1',
      name: 'Savon',
      icon: 'soap',
      color: '#000',
      price: 1000,
      costPrice: 500,
      minPrice: 800,
      maxPrice: 1200,
      atomicUnit: 'pièce',
      packagingLevels: [],
    });

    expect(renderAddSheet).toHaveBeenCalledWith(
      expect.objectContaining({ product: expect.objectContaining({ id: 'a1' }) })
    );
  });

  it('AddSheetValided ajoute au panier, ajuste le stock local et met à jour le compteur tabbar', async () => {
    const addToCart = vi.spyOn(Basket.prototype, 'addToCart');
    const updateCartCount = vi.spyOn(Tabbar.prototype, 'updateCartCount');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.AddSheetValided, {
      id: 'a1',
      name: 'Savon',
      price: 1000,
      qty: 2,
      atomicUnit: 'pièce',
      packagingLevels: [],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', quantity: 2 })
    );
    expect(articleController.adjustStockLocally).toHaveBeenCalledWith('a1', -2);
    expect(updateCartCount).toHaveBeenCalledWith(2);
  });

  it('AddSheetValided met à jour le catalogue avec le vrai stock restant, pas le delta', async () => {
    articleController.adjustStockLocally.mockResolvedValueOnce({
      id: 'a1',
      quantity: 38,
    });
    const updateArticleQuantity = vi.spyOn(Catalog.prototype, 'updateArticleQuantity');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.AddSheetValided, {
      id: 'a1',
      name: 'Savon',
      price: 1000,
      qty: 2,
      atomicUnit: 'pièce',
      packagingLevels: [],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updateArticleQuantity).toHaveBeenCalledWith('a1', 38);
  });

  it("AddSheetValided avec un palier de conditionnement décrémente le stock par qty × ratio, pas qty brut", async () => {
    const addToCart = vi.spyOn(Basket.prototype, 'addToCart');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.AddSheetValided, {
      id: 'a1',
      name: 'Lait en poudre',
      price: 11000,
      qty: 1,
      atomicUnit: 'pièce',
      packagingLevels: [{ label: 'Carton de 12', ratio: 12, price: 11000 }],
      soldAsLabel: 'Carton de 12',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 1 carton × ratio 12 = 12 unités atomiques décrémentées, pas 1.
    expect(articleController.adjustStockLocally).toHaveBeenCalledWith('a1', -12);
    expect(addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', quantity: 1, soldAsLabel: 'Carton de 12' })
    );
  });

  it("RemoveCard avec un palier de conditionnement restitue qty × ratio au stock", async () => {
    articleController.getLocalById.mockResolvedValue({
      id: 'a1',
      packagingLevels: [{ label: 'Carton de 12', ratio: 12, price: 11000 }],
    });
    const renderBasket = vi.spyOn(Basket.prototype, 'render');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const renderCall = renderBasket.mock.calls.at(-1)?.[0] as unknown as {
      onClickRemoveCard: (item: unknown) => Promise<void>;
    };
    await renderCall.onClickRemoveCard({ id: 'a1', quantity: 2, soldAsLabel: 'Carton de 12' });

    // 2 cartons retirés × ratio 12 = 24 unités atomiques restituées.
    expect(articleController.adjustStockLocally).toHaveBeenCalledWith('a1', 24);
  });

  it("RemoveCard met à jour le catalogue avec le vrai stock restant, pas le delta", async () => {
    articleController.adjustStockLocally.mockResolvedValueOnce({
      id: 'a1',
      quantity: 12,
    });
    const updateArticleQuantity = vi.spyOn(Catalog.prototype, 'updateArticleQuantity');
    const renderBasket = vi.spyOn(Basket.prototype, 'render');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const renderCall = renderBasket.mock.calls.at(-1)?.[0] as unknown as {
      onClickRemoveCard: (item: unknown) => Promise<void>;
    };
    await renderCall.onClickRemoveCard({ id: 'a1', quantity: 3 });

    expect(articleController.adjustStockLocally).toHaveBeenCalledWith('a1', 3);
    expect(updateArticleQuantity).toHaveBeenCalledWith('a1', 12);
  });

  it('SellingStarted avec resetClient=true vide le panier, le compteur et la sélection client', () => {
    const resetItems = vi.spyOn(Basket.prototype, 'resetItems');
    const clearSelection = vi.spyOn(ClientProfilePanel.prototype, 'clearSelection');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.SellingStarted, { resetClient: true });

    expect(resetItems).toHaveBeenCalled();
    expect(clearSelection).toHaveBeenCalled();
  });

  it("SellingStarted avec resetClient=false ne vide PAS le panier ni la sélection client (annulation du récap)", () => {
    const resetItems = vi.spyOn(Basket.prototype, 'resetItems');
    const clearSelection = vi.spyOn(ClientProfilePanel.prototype, 'clearSelection');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.SellingStarted, { resetClient: false });

    expect(resetItems).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
  });

  it('CartSyncedFromRecap synchronise le panier avec les articles retirés dans le récap et ajuste le compteur tabbar', async () => {
    const setItems = vi.spyOn(Basket.prototype, 'setItems');
    const updateCartCount = vi.spyOn(Tabbar.prototype, 'updateCartCount');
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.AddSheetValided, { id: 'a1', name: 'Savon', price: 1000, qty: 1, atomicUnit: 'pièce', packagingLevels: [] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    EventBus.getInstance().emit(AppEvent.AddSheetValided, { id: 'a2', name: 'Riz', price: 5000, qty: 1, atomicUnit: 'pièce', packagingLevels: [] });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Dans le récap, l'article a2 a été retiré — onCancel ne renvoie plus que a1.
    EventBus.getInstance().emit(AppEvent.CartSyncedFromRecap, [
      { id: 'a1', name: 'Savon', price: 1000, quantity: 1 },
    ]);

    expect(setItems).toHaveBeenCalledWith([expect.objectContaining({ id: 'a1', quantity: 1 })]);
    expect(updateCartCount).toHaveBeenCalledWith(-1); // 1 (nouveau total) - 2 (ancien cartCount)
  });

  it("Disconnected réinitialise l'instance interne", () => {
    CataloguePanel.init();
    EventBus.getInstance().emit(AppEvent.Connected, undefined);

    EventBus.getInstance().emit(AppEvent.Disconnected, undefined);

    // Après reset, un nouveau Connected doit re-mount sans lever d'erreur.
    expect(() => EventBus.getInstance().emit(AppEvent.Connected, undefined)).not.toThrow();
  });
});
