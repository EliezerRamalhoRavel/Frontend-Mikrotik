import api from "@/lib/axios";
import type { BackupResponse, BackupFile } from "@/types/backup";

export const backupService = {
  getAll: async (page = 1, size = 1000, sortBy?: string): Promise<BackupResponse> => {
    let url = `/backups?page=${page}&size=${size}`;
    if (sortBy) {
        url += `&sort_by=${encodeURIComponent(sortBy)}`;
    }
    const { data } = await api.get<BackupResponse>(url);
    return data;
  },

  getClientFiles: async (clientName: string): Promise<BackupFile[]> => {
    const { data } = await api.get<BackupFile[]>(`/backups/${clientName}/files`);
    return data;
  }
};