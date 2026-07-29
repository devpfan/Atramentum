export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type RegisterCredentials = LoginCredentials;
