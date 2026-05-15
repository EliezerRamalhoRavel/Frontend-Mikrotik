import api from "@/lib/axios";
import type {
  MikrotikBulkPasswordItem,
  MikrotikBulkPasswordResponse,
  MikrotikRouterUserInventory,
  MikrotikUser,
  MikrotikUserPasswordJob,
  MikrotikUserUpdate,
} from "@/types/mikrotikUsers";

export const mikrotikUsersService = {
  listRouterUsers: async (deviceId: string): Promise<MikrotikUser[]> => {
    const { data } = await api.get<MikrotikUser[]>(`/devices/${deviceId}/router-users`);
    return data;
  },

  listRouterUsersInventory: async (): Promise<MikrotikRouterUserInventory[]> => {
    const { data } = await api.get<MikrotikRouterUserInventory[]>("/devices/router-users");
    return data;
  },

  updateRouterUser: async (
    deviceId: string,
    userId: string,
    payload: MikrotikUserUpdate,
    stepUpToken: string,
  ): Promise<MikrotikUserPasswordJob> => {
    const { data } = await api.patch<MikrotikUserPasswordJob>(`/devices/${deviceId}/router-users/${encodeURIComponent(userId)}`, payload, {
      headers: {
        "X-Step-Up-Token": stepUpToken,
      },
    });
    return data;
  },

  bulkUpdateRouterUserPasswords: async (
    items: MikrotikBulkPasswordItem[],
    password: string,
    stepUpToken: string,
  ): Promise<MikrotikBulkPasswordResponse> => {
    const { data } = await api.post<MikrotikBulkPasswordResponse>(
      "/devices/router-users/bulk-password-change",
      { items, password },
      {
        headers: {
          "X-Step-Up-Token": stepUpToken,
        },
      },
    );
    return data;
  },
};
