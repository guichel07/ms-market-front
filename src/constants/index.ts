export const FOOTER_MASSAGE = `© Maman Solution — Gestion des ventes simplifiée`;

/**
 * Injectées au build par Vite (voir vite.config.ts + CI, jamais en dur ici —
 * incident réel rencontré sur ms-front-admin : un build sans ces variables
 * embarque le fallback localhost dans le bundle livré aux vrais utilisateurs).
 */
export const API_URL_AUTH =
  import.meta.env.VITE_API_URL_AUTH ?? 'http://localhost:8080/ms-auth';
export const API_URL_ARTICLES =
  import.meta.env.VITE_API_URL_ORDER_SERVICE
    ? `${import.meta.env.VITE_API_URL_ORDER_SERVICE}/articles`
    : 'http://localhost:8081/articles';
export const API_URL_ORDERS =
  import.meta.env.VITE_API_URL_ORDER_SERVICE
    ? `${import.meta.env.VITE_API_URL_ORDER_SERVICE}/orders`
    : 'http://localhost:8081/orders';
export const API_URL_CLIENTS =
  import.meta.env.VITE_API_URL_ORDER_SERVICE
    ? `${import.meta.env.VITE_API_URL_ORDER_SERVICE}/clients`
    : 'http://localhost:8081/clients';

/**
 * Liste centrale de tous les événements de l'application.
 * Convention : "domaine:action", toujours au présent/participe passé
 * (l'événement dit ce qui VIENT DE se passer, jamais ce qui va se passer).
 */
export const AppEvent = {
  // --- Authentification ---
  NotConnected: 'auth:not-connected', // émis au tout début si personne n'est connecté
  Connected: 'auth:connected',
  Disconnected: 'auth:disconnected',

  // --- Vente : SellingStarted/RecapStarted/SaleRegistered émis uniquement par
  // OrderState.transitionTo, jamais ailleurs ---
  SellingStarted: 'order:selling-started', // état SELLING (nouvelle vente ou annulation du récap)
  RecapStarted: 'order:recap-started', // état RECAP (panier validé, prêt à confirmer)
  SaleConfirmed: 'order:sale-confirmed', // clic sur "Confirmer" dans le récap — déclenche l'enregistrement
  SaleRegistered: 'order:sale-registered', // état CONFIRMED (vente enregistrée en local + backend)

  // --- Catalogue / stock ---
  ArticlesSynced: 'article:articles-synced', // données fraîches disponibles (après fetch backend)
  ArticleStockSynced: 'article:stock-synced', // stock d'un article changé localement
  ArticleClicked: 'article:clicked', // clic sur une carte produit du catalogue

  // --- Panier ---
  CartItemAdded: 'cart:item-added',
  CartItemRemoved: 'cart:item-removed',
  AddSheetValided: 'addSheet:validated',

  // --- Client ---
  ClientsUpdated: 'client:updated',
  OnSelectCustomer: 'select:customer',

  // --- Navigation ---
  MenuOpened: 'menu:opened',
  MenuItemSelected: 'menu:item-selected',
  NavItemSelected: 'nav:item-selected',

  // --- Confirmation ---
  ConfirmationClickRecu: 'confirmation:click-recu',

  // --- Ventes du jour ---
  DailyTotalChanged: 'sale:daily-total-changed', // émis par DailySalesController après mise à jour du total
} as const;

export type AppEvent = (typeof AppEvent)[keyof typeof AppEvent];
