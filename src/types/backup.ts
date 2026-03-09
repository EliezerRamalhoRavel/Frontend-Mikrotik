export interface Backup {
  id: string;
  client_name: string;
  last_file_name?: string;
  last_backup_date?: string;
  status: 'ok' | 'overdue' | 'empty' | 'warning' | 'unknown';
  days_since_last?: number;
  updated_at: string;
}

export interface BackupResponse {
  items: Backup[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface BackupFile {
  name: string;
  size: number;
  date: string;
  is_recent: boolean;
}