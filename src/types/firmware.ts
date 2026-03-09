export interface FirmwareRule {
  id: string;
  model: string;
  version: string;
  created_at?: string;
}

export interface FirmwareDashboardItem {
  device_id: string;
  device_name: string;
  device_ip: string;
  model: string;
  current_version: string | null;
  target_version: string | null;
  status: "updated" | "outdated" | "no_rule" | "unknown";
}

export interface FirmwareCreate {
  model: string;
  version: string;
}