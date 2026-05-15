import api from "@/lib/axios";
import type { Mikrotik, MikrotikCreate, MikrotikUpdate } from "@/types/mikrotik";

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const mikrotikService = {
  getAll: async (page = 1, size = 100): Promise<Page<Mikrotik>> => {
    const url = `/devices?page=${page}&size=${size}`;
    const { data } = await api.get<Page<Mikrotik>>(url);
    return data;
  },

  getAllDevices: async (): Promise<Mikrotik[]> => {
    try {
      // 1. Busca a primeira página para saber o total
      const firstPage = await mikrotikService.getAll(1, 100);
      let allItems = [...firstPage.items];
      const totalPages = firstPage.pages;

      // 2. Se houver mais páginas, busca o restante em paralelo
      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= totalPages; p++) {
          promises.push(mikrotikService.getAll(p, 100));
        }

        const responses = await Promise.all(promises);
        responses.forEach(pageData => {
          allItems = [...allItems, ...pageData.items];
        });
      }

      return allItems;
    } catch (error) {
      console.error("Erro ao buscar todos os dispositivos:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Mikrotik> => {
    const { data } = await api.get<Mikrotik>(`/devices/${id}`);
    return data;
  },

  create: async (payload: MikrotikCreate): Promise<Mikrotik> => {
    const { data } = await api.post<Mikrotik>("/devices", payload);
    return data;
  },

  update: async (id: string, payload: MikrotikUpdate): Promise<Mikrotik> => {
    const { data } = await api.patch<Mikrotik>(`/devices/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/devices/${id}`);
  }
};
