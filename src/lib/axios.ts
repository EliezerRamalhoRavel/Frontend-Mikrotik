import axios from 'axios';

interface ApiLogPayload {
  status: 'Sucesso' | 'Falha';
  method: string;
  url: string;
  statusCode?: number;
}

export const api = axios.create({
  baseURL: "http://172.16.200.9:8065/api/v1",
  withCredentials: true
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@mikrotik_web:token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    if (method && method !== 'GET') {
      const logPayload: ApiLogPayload = {
        status: 'Sucesso',
        method: method,
        url: response.config.url || '',
        statusCode: response.status,
      };
      window.dispatchEvent(new CustomEvent('api-log', { detail: logPayload }));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const method = originalRequest?.method?.toUpperCase();

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const { access_token } = response.data;

        localStorage.setItem('@mikrotik_web:token', access_token);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('@mikrotik_web:token');
        localStorage.removeItem('@mikrotik_web:user');
        window.dispatchEvent(new Event('auth-error'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (method && method !== 'GET') {
      const logPayload: ApiLogPayload = {
        status: 'Falha',
        method: method,
        url: originalRequest.url || '',
        statusCode: error.response?.status,
      };
      window.dispatchEvent(new CustomEvent('api-log', { detail: logPayload }));
    }

    return Promise.reject(error);
  }
);

export default api;