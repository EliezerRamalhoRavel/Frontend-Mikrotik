export interface MikrotikUser {
  id: string;
  name: string;
  disabled: boolean;
  group: string | null;
  address: string | null;
  last_logged_in: string | null;
  is_connection_user: boolean;
  is_present: boolean;
  job_id: string | null;
  job_status: string | null;
  job_action: string | null;
  job_attempts: number;
  job_last_error: string | null;
}

export interface MikrotikUserUpdate {
  disabled?: boolean;
  password?: string;
}

export interface MikrotikUserPasswordJob {
  id: string;
  status: string;
  attempts: number;
  username: string;
  action: string;
  last_error: string | null;
}

export interface MikrotikRouterUserInventory extends MikrotikUser {
  device_id: string;
  device_name: string;
  company_id: string;
}

export interface MikrotikBulkPasswordItem {
  device_id: string;
  routeros_user_id: string;
}

export interface MikrotikBulkPasswordResponse {
  total: number;
  jobs: MikrotikUserPasswordJob[];
}
