export const ROUTER_USER_PASSWORD_PROGRESS_EVENT = "router-user-password-progress";
const STORAGE_KEY = "mikrotik-router-user-password-progress";

export interface RouterUserPasswordProgressItem {
  device_id: string;
  routeros_user_id: string;
  device_name: string;
  username: string;
}

export interface RouterUserPasswordProgressState {
  id: string;
  current: number;
  total: number;
  deviceName: string;
  username: string;
  items: RouterUserPasswordProgressItem[];
  startedAt: number;
  updatedAt: number;
}

const notifyProgressChange = () => {
  window.dispatchEvent(new Event(ROUTER_USER_PASSWORD_PROGRESS_EVENT));
};

export const getRouterUserPasswordProgress = (): RouterUserPasswordProgressState | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RouterUserPasswordProgressState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setRouterUserPasswordProgress = (progress: RouterUserPasswordProgressState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  notifyProgressChange();
};

export const clearRouterUserPasswordProgress = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  notifyProgressChange();
};

export const subscribeRouterUserPasswordProgress = (callback: () => void) => {
  window.addEventListener(ROUTER_USER_PASSWORD_PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(ROUTER_USER_PASSWORD_PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
