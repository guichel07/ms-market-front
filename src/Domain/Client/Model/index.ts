/**
 * `id` optionnel : absent tant qu'un client créé hors-ligne n'a pas encore
 * été synchronisé avec ms-order-service (voir ClientService.getAll — la
 * synchro des clients "pending" est ce qui leur attribue un id réel).
 */
export interface ClientDTO {
  id?: string;
  firstname: string;
  lastname: string;
  phone: string;
}
