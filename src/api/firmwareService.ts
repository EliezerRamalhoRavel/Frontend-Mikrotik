// MUDEI AQUI: Importar de @/lib/axios em vez de ./axiosConfig
import { api } from "@/lib/axios"; 
import type { FirmwareRule, FirmwareDashboardItem } from "@/types/firmware";

export const firmwareService = {
  getRules: async (): Promise<FirmwareRule[]> => {
    const response = await api.get("/firmware/rules");
    return response.data;
  },

  createRule: async (data: { model: string; version: string }): Promise<FirmwareRule> => {
    const response = await api.post("/firmware/rules", data);
    return response.data;
  },

  // Função de Editar
  updateRule: async (id: string, data: { version: string }): Promise<FirmwareRule> => {
    const response = await api.patch(`/firmware/rules/${id}`, data);
    return response.data;
  },

  deleteRule: async (id: string): Promise<void> => {
    await api.delete(`/firmware/rules/${id}`);
  },

  getDashboard: async (): Promise<FirmwareDashboardItem[]> => {
    const response = await api.get("/firmware/dashboard");
    return response.data;
  }
};