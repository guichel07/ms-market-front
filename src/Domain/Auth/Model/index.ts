export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Miroir de UserDTO côté ms-auth (id/email/name/tag/role/svgAvatar/contact/active).
 */
export interface SellerData {
  id: number;
  email: string;
  name: string;
  tag: string;
  role: string;
  svgAvatar: string;
  contact: string;
  active: boolean;
}
