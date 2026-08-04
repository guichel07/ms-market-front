export interface OrderLineDTO {
  articleId: string;
  quantity: number;
  price: number;
  /** Libellé du palier de vente choisi (voir Article.packagingLevels côté back) — absent = vente à l'unité atomique. */
  soldAsLabel?: string;
}

/**
 * Miroir de OrderRequestDTO côté ms-order-service. `clientId` est l'id Mongo
 * du client (obligatoire côté backend) — PAS son téléphone.
 */
export interface OrderDTO {
  sellerName: string;
  email: string;
  saleDate: string;
  dailySummary: number;
  clientId: string;
  items: OrderLineDTO[];
}
