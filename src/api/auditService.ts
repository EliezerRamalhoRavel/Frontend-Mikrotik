import api from "@/lib/axios";
import type { AuditLog } from "@/types/audit";

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const auditService = {
  getAll: async (page = 1, size = 20, sortBy?: string): Promise<Page<AuditLog>> => {
    let url = `/management/audit?page=${page}&size=${size}`;
    if (sortBy) {
        url += `&sort_by=${encodeURIComponent(sortBy)}`;
    }
    const { data } = await api.get<Page<AuditLog>>(url);
    return data;
  },
};