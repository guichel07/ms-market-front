export interface PackagingLevel {
  label: string;
  ratio: number;
  price: number;
}

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
  /** Unité indivisible ("pièce", "kg", "verre"...) — remplace l'ancien 'piece'|'kg' binaire. */
  atomicUnit: string;
  /** Paliers de vente additionnels (ex: "Carton de 12") — vide = vente strictement à l'unité atomique. */
  packagingLevels: PackagingLevel[];
  criticalStock: number;
  archived: boolean;
}
