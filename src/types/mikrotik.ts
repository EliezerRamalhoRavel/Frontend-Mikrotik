export interface Mikrotik {
  id: string; // Backend usa UUID
  
  // --- Identificação ---
  name: string; // Cliente
  ip_address: string; // IP/DDNS
  port: number;
  
  // --- Hardware & Software ---
  model?: string; // Ex: RB750Gr3
  firmware_version?: string; // Ex: 6.48.6
  
  // --- Acesso ---
  username: string;
  // password não retorna no get por segurança
  
  // --- Configuração de Rede ---
  interface_1?: string; // Ex: eth4 - Principal - VIVO
  interface_2?: string; // Ex: eth2 - Backup - CLARO
  
  // --- VPN ---
  has_vpn: boolean; // Sim/Não
  vpn_amount: number; // Quantidade
  
  // --- Switches de Controle ---
  is_active: boolean; // Status de Monitoramento (Ativo/Inativo)
  is_management_active: boolean; // Gestão (Ativo/Inativo)
  
  // --- Status Dinâmicos (Preenchidos pelo Robô) ---
  status: 'online' | 'offline' | 'unknown' | 'warning' | 'config_error' | 'online_api_error';
  last_seen?: string; 
  last_error?: string;
}

export interface MikrotikCreate {
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string; // Obrigatório na criação
  
  is_active?: boolean;
  is_management_active?: boolean;
  
  model?: string;
  firmware_version?: string;
  
  interface_1?: string;
  interface_2?: string;
  
  has_vpn?: boolean;
  vpn_amount?: number;
}

export interface MikrotikUpdate {
  name?: string;
  ip_address?: string;
  port?: number;
  username?: string;
  password?: string; // Opcional na edição
  
  is_active?: boolean;
  is_management_active?: boolean;
  
  model?: string;
  firmware_version?: string;
  
  interface_1?: string;
  interface_2?: string;
  
  has_vpn?: boolean;
  vpn_amount?: number;
}