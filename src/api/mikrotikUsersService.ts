import api from "@/lib/axios";
import type { MikrotikUser, MikrotikUserUpdate } from "@/types/mikrotikUsers";

export const mikrotikUsersService = {
  listRouterUsers: async (deviceId: string): Promise<MikrotikUser[]> => {
    const { data } = await api.get<MikrotikUser[]>(`/devices/${deviceId}/router-users`);
    return data;
  },

  updateRouterUser: async (
    deviceId: string,
    userId: string,
    payload: MikrotikUserUpdate,
    stepUpToken: string,
  ): Promise<void> => {
    await api.patch(`/devices/${deviceId}/router-users/${encodeURIComponent(userId)}`, payload, {
      headers: {
        "X-Step-Up-Token": stepUpToken,
      },
    });
  },
};
