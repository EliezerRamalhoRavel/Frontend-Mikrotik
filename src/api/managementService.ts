import api from "@/lib/axios";
import type { User, UserCreate, UserUpdate, Group, GroupCreate, GroupUpdate, Permission } from "@/types/management";

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Company {
    id: string;
    name: string;
    slug: string;
}

export const managementService = {
  getAllUsers: async (page = 1, size = 20): Promise<Page<User>> => {
    const { data } = await api.get<Page<User>>(`/management/users?page=${page}&size=${size}`);
    return data;
  },

  createUser: async (payload: UserCreate): Promise<User> => {
    const { data } = await api.post<User>("/management/users", payload);
    return data;
  },

  updateUser: async (id: string, payload: UserUpdate): Promise<User> => {
    const { data } = await api.patch<User>(`/management/users/${id}`, payload);
    return data;
  },

  resetUserMfa: async (id: string): Promise<void> => {
    await api.post(`/management/users/${id}/reset-2fa`);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/management/users/${id}`);
  },

  getAllGroups: async (page = 1, size = 100, company_id?: string): Promise<Page<Group>> => {
    let url = `/management/groups?page=${page}&size=${size}`;
    if (company_id) {
        url += `&company_id=${company_id}`;
    }
    const { data } = await api.get<Page<Group>>(url);
    return data;
  },

  createGroup: async (payload: GroupCreate): Promise<Group> => {
    const { data } = await api.post<Group>("/management/groups", payload);
    return data;
  },

  updateGroup: async (id: string, payload: GroupUpdate): Promise<Group> => {
    const { data } = await api.patch<Group>(`/management/groups/${id}`, payload);
    return data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await api.delete(`/management/groups/${id}`);
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const { data } = await api.get<Permission[]>("/management/permissions");
    return data;
  },

  getAllCompanies: async (): Promise<Company[]> => {
    const { data } = await api.get<Page<Company>>("/admin/companies?size=100");
    return data.items;
  }
};