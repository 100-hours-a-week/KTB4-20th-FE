import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { refreshAccessTokenOnce } from '../auth/authSession';
import { getAccessToken } from '../auth/tokenStore';

// Refresh Token은 HttpOnly Secure Cookie로 전달되므로 자격 증명 포함 요청이 필요하다.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
}

const AUTH_REFRESH_EXEMPT_PATHS = ['/auth/refresh', '/auth/logout'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const isExempt = AUTH_REFRESH_EXEMPT_PATHS.some((path) => config?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      error.response.data?.code === 'AUTHENTICATION_REQUIRED' &&
      config &&
      !config._retriedAfterRefresh &&
      !isExempt
    ) {
      config._retriedAfterRefresh = true;
      const token = await refreshAccessTokenOnce();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
