import api from "@/lib/axios";
import type { MikrotikUser, MikrotikUserUpdate } from "@/types/mikrotikUsers";

export const mikrotikUsersService = {
  listPppUsers: async (deviceId: string): Promise<MikrotikUser[]> => {
    const { data } = await api.get<MikrotikUser[]>(`/devices/${deviceId}/ppp-users`);
    return data;
  },

  updatePppUser: async (
    deviceId: string,
    userId: string,
    payload: MikrotikUserUpdate,
    stepUpToken: string,
  ): Promise<void> => {
    await api.patch(`/devices/${deviceId}/ppp-users/${encodeURIComponent(userId)}`, payload, {
      headers: {
        "X-Step-Up-Token": stepUpToken,
      },
    });
  },
};
