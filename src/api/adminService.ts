import api from "@/lib/axios";
import type { Company, CompanyCreate, CompanyUpdate } from "@/types/admin";

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const adminService = {
  getAllCompanies: async (page = 1, size = 10, search = "", sortBy?: string): Promise<Page<Company>> => {
    let url = `/admin/companies?page=${page}&size=${size}`;
    if (search) {
        url += `&name=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
        url += `&sort_by=${encodeURIComponent(sortBy)}`;
    }
    const { data } = await api.get<Page<Company>>(url);
    return data;
  },

  createCompany: async (payload: CompanyCreate): Promise<Company> => {
    const { data } = await api.post<Company>("/admin/companies", payload);
    return data;
  },

  updateCompany: async (id: string, payload: CompanyUpdate): Promise<Company> => {
    const { data } = await api.patch<Company>(`/admin/companies/${id}`, payload);
    return data;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/admin/companies/${id}`);
  }
};