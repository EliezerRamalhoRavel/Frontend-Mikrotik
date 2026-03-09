import api from "@/lib/axios";
import type { PingTarget, PingTargetCreate, PingTargetUpdate } from "@/types/ping";

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const pingService = {
  getAll: async (page = 1, size = 20, sortBy?: string): Promise<Page<PingTarget>> => {
    let url = `/ping-targets?page=${page}&size=${size}`;
    if (sortBy) {
        url += `&sort_by=${encodeURIComponent(sortBy)}`;
    }
    const { data } = await api.get<Page<PingTarget>>(url);
    return data;
  },

  create: async (payload: PingTargetCreate): Promise<PingTarget> => {
    const { data } = await api.post<PingTarget>("/ping-targets", payload);
    return data;
  },

  update: async (id: string, payload: PingTargetUpdate): Promise<PingTarget> => {
    const { data } = await api.patch<PingTarget>(`/ping-targets/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/ping-targets/${id}`);
  }
};