export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;     // ex: "CREATE", "UPDATE", "LOGIN"
  resource: string;   // ex: "device", "auth", "ping_target"
  target_id?: string;
  changes?: Record<string, any>; // JSON com o que mudou
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // O backend pode retornar dados do usuário se fizer join, 
  // mas por enquanto vamos focar no básico.
}