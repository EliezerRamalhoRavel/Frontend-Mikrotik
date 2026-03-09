export interface Permission {
  id: string;
  name: string;
  description?: string;
  codename?: string;
}

export interface Group {
  id: string;
  name: string;
  company_id: string;
  permissions: Permission[];
}

export interface GroupCreate {
  name: string;
  permission_ids: string[];
}

export interface GroupUpdate {
  name?: string;
  permission_ids?: string[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_root?: boolean;
  company_id: string;
  groups: Group[];
  is_two_factor_enabled: boolean;
  mfa_setup_required: boolean;
  mfa_expiration_hours: number;
  mfa_enabled_at: string | null;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  group_ids: string[];
  company_id?: string;
  mfa_setup_required: boolean;
  mfa_expiration_hours: number;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  is_active?: boolean;
  group_ids?: string[];
  password?: string;
  mfa_setup_required?: boolean;
  mfa_expiration_hours?: number;
}