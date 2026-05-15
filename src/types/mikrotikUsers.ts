export interface MikrotikUser {
  id: string;
  name: string;
  disabled: boolean;
  group: string | null;
  address: string | null;
  last_logged_in: string | null;
}

export interface MikrotikUserUpdate {
  disabled?: boolean;
  password?: string;
}
