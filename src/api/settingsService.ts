import { api } from "@/lib/axios";

// Tipagem exata conforme o Pydantic/Banco de Dados atualizado
export interface SettingsData {
  id?: string;
  company_id?: string;

  // Mikrotik
  ativar_monitoramento_mikrotiks: 'sim' | 'nao';
  intervalo_tentativas_mikrotiks: number;
  repetir_tentativa_mikrotiks: number;
  notificacoes_email_mikrotiks: 'sim' | 'nao';
  endereco_email_mikrotiks?: string;
  titulo_email_mikrotiks?: string;
  notificacoes_teams_mikrotiks: 'sim' | 'nao';
  url_webhook_mikrotiks?: string;
  url_webhook_mikrotiks_secundario?: string;

  // Ping
  ativar_monitoramento_ping: 'sim' | 'nao';
  intervalo_tentativas_ping: number;
  repetir_tentativa_ping: number;
  notificacoes_email_ping: 'sim' | 'nao';
  endereco_email_ping?: string;
  titulo_email_ping?: string;
  notificacoes_teams_ping: 'sim' | 'nao';
  url_webhook_ping?: string;

  // Backups
  ativar_monitoramento_backups: 'sim' | 'nao';
  tempo_saudavel_backup: number;
  tempo_nao_saudavel_backup: number;
  notificacoes_email_backups: 'sim' | 'nao';
  endereco_email_backups?: string;
  titulo_email_backups?: string;
  notificacoes_teams_backups: 'sim' | 'nao';
  url_webhook_backups?: string;

  // Firmware
  ativar_monitoramento_firmware: 'sim' | 'nao';
  intervalo_tentativas_firmware: number;
  notificacoes_email_firmware: 'sim' | 'nao';
  endereco_email_firmware?: string;
  titulo_email_firmware?: string;
  notificacoes_teams_firmware: 'sim' | 'nao';
  url_webhook_firmware?: string;
}

export const settingsService = {
  get: async (): Promise<SettingsData> => {
    const response = await api.get("/settings");
    return response.data;
  },
  update: async (data: SettingsData): Promise<SettingsData> => {
    const response = await api.patch("/settings", data);
    return response.data;
  }
};