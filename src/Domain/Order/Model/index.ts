export interface OrderLineDTO {
  articleId: string;
  quantity: number;
  price: number;
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
