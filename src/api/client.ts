import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { refreshAccessTokenOnce } from '../auth/authSession';
import { emitSessionExpired } from '../auth/sessionEvents';
import { getAccessToken } from '../auth/tokenStore';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * true면 Access Token(Authorization 헤더)을 붙이지 않고, 401이 와도 재발급·재요청하지 않는다.
     * 로그인 없이도 부를 수 있는 API(초대 링크 첫 검증)에 만료된 토큰이 섞여
     * "링크는 유효함(AUTHENTICATION_REQUIRED)"과 "토큰 만료"가 구분되지 않는 일을 막는다.
     */
    skipAuth?: boolean;
  }
}

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
  if (config.skipAuth) {
    return config;
  }
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

/**
 * 이 Access Token으로는 더 이상 요청을 처리할 수 없다는 401 코드들.
 * USER_WITHDRAWN은 다른 세션(다른 탭·기기)에서 방금 탈퇴 처리된 경우로,
 * 이 토큰은 만료되지 않았지만 더 이상 유효한 사용자가 아니라서 갱신도 실패한다.
 */
const SESSION_INVALID_CODES = ['AUTHENTICATION_REQUIRED', 'USER_WITHDRAWN'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const isExempt = AUTH_REFRESH_EXEMPT_PATHS.some((path) => config?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      !!error.response.data?.code &&
      SESSION_INVALID_CODES.includes(error.response.data.code) &&
      config &&
      !config.skipAuth &&
      !config._retriedAfterRefresh &&
      !isExempt
    ) {
      config._retriedAfterRefresh = true;
      const token = await refreshAccessTokenOnce();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
        return apiClient(config);
      }
      // 재발급도 실패하면 세션이 완전히 끝난 것이다. 로그인 상태를 해제해서 로그인 화면으로 보낸다.
      emitSessionExpired();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
