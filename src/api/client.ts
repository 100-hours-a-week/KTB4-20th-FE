import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from './tokenStore';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * true면 로그인 토큰(Authorization 헤더)을 붙이지 않고, 401이 와도 토큰 재발급을 시도하지 않습니다.
     * 로그인 없이도 부를 수 있는 API에 만료된 토큰을 보내 401이 섞이는 일을 막을 때 씁니다.
     */
    skipAuth?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) return config;
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;

/** Access Token이 만료되어 401이 왔을 때 사용할 재발급 함수를 등록합니다. */
export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !refreshHandler) {
    throw error;
  }

  const config = error.config as RetryableRequestConfig | undefined;
  // 인증 요청(재발급, 로그아웃) 자체의 401은 다시 재발급하지 않습니다.
  if (!config || config.skipAuth || config._retried || config.url?.startsWith('/auth/')) {
    throw error;
  }

  const newToken = await refreshHandler();
  if (!newToken) {
    throw error;
  }

  config._retried = true;
  config.headers.Authorization = `Bearer ${newToken}`;
  return apiClient(config);
});

export default apiClient;
