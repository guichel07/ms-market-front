export type AgeCategory = 'ENFANT' | 'ADO' | 'ADULTE';
export type Gender = 'HOMME' | 'FEMME';

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
  ageCategory?: AgeCategory;
  gender?: Gender;
  anonymous?: boolean;
}

/** Les 6 profils anonymes possibles (voir ms-order-service Client.anonymous). */
export interface AnonymousProfile {
  label: string;
  ageCategory: AgeCategory;
  gender: Gender;
}

export const ANONYMOUS_PROFILES: AnonymousProfile[] = [
  { label: 'Garçon', ageCategory: 'ENFANT', gender: 'HOMME' },
  { label: 'Fille', ageCategory: 'ENFANT', gender: 'FEMME' },
  { label: 'Ado', ageCategory: 'ADO', gender: 'HOMME' },
  { label: 'Adolescente', ageCategory: 'ADO', gender: 'FEMME' },
  { label: 'Homme', ageCategory: 'ADULTE', gender: 'HOMME' },
  { label: 'Femme', ageCategory: 'ADULTE', gender: 'FEMME' },
];
