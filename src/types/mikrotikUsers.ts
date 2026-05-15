export interface MikrotikUser {
  id: string;
  name: string;
  disabled: boolean;
  profile: string | null;
  comment: string | null;
  service: string | null;
}

export interface MikrotikUserUpdate {
  disabled?: boolean;
  password?: string;
}
