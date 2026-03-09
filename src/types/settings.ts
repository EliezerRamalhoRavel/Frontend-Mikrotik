export interface Settings {
  id: string;
  company_id: string;
  
  // Mikrotik
  mikrotik_monitoring_enabled: boolean;
  mikrotik_check_interval: number; // Segundos
  mikrotik_retry_attempts: number;
  mikrotik_notify_email: boolean;
  mikrotik_email_addresses?: string;
  mikrotik_notify_teams: boolean;
  mikrotik_webhook_primary?: string;
  mikrotik_webhook_failure?: string;

  // Ping
  ping_monitoring_enabled: boolean;
  ping_check_interval: number;
  ping_notify_email: boolean;
  ping_email_addresses?: string;
  ping_notify_teams: boolean;
  ping_webhook_url?: string;

  // Backup
  backup_monitoring_enabled: boolean;
  backup_days_ok: number;
  backup_days_fail: number;
  backup_notify_email: boolean;
  backup_email_addresses?: string;
  backup_notify_teams: boolean;
  backup_webhook_url?: string;
}

export type SettingsUpdate = Partial<Omit<Settings, "id" | "company_id">>;