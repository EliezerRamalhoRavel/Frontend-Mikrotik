import { Group } from "./management";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_root: boolean;
  company_id: string;
  groups: Group[]; 
  is_two_factor_enabled: boolean;
  mfa_enabled_at: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  code_2fa?: string;
}