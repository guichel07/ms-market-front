/**
 * Miroir partiel de ArticleResponseDTO côté ms-order-service — uniquement
 * les champs utiles à un point de vente (pas les champs de gestion des prix
 * d'achat/marge, qui relèvent de ms-front-admin).
 */
export interface ArticleDTO {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  price: number;
  quantity: number;
  unit: 'piece' | 'kg';
  criticalStock: number;
  archived: boolean;
}
