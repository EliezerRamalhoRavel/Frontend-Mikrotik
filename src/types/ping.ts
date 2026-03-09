export interface PingTarget {
  id: string;
  name: string;
  target: string;
  packet_count: number;
  status: 'online' | 'offline' | 'high_latency' | 'unknown';
  last_latency_ms?: number;
  last_seen?: string;
  is_active: boolean;
  company_id: string;
}

export interface PingTargetCreate {
  name: string;
  target: string;
  packet_count: number;
}

export interface PingTargetUpdate {
  name?: string;
  target?: string;
  packet_count?: number;
  is_active?: boolean;
}