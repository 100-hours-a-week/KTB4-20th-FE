import axios from 'axios';
import type { ApiResponse } from '../api/types';
import { getAccessToken, setAccessToken } from './tokenStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface AccessTokenData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

let refreshPromise: Promise<string | null> | null = null;

/** 로그인 상태 확인·로그아웃 요청이 이 시간 안에 끝나지 않으면 실패로 보고 로그인 화면으로 보냅니다. */
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

/**
 * POST /api/auth/refresh — refresh_token Cookie로 새 Access Token을 발급받아 메모리에 저장한다.
 * 동시에 여러 번 호출되어도 진행 중인 요청 하나만 실제로 수행한다.
 */
export function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AccessTokenData>>(`${API_BASE_URL}/auth/refresh`, null, {
        withCredentials: true,
        timeout: AUTH_REQUEST_TIMEOUT_MS,
      })
      .then((response) => {
        const token = response.data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** 만료까지 이 시간보다 적게 남은 Access Token은 미리 재발급한다. */
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30_000;

/** JWT payload의 exp(초)를 밀리초로 돌려준다. 읽을 수 없으면 null */
function getAccessTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: unknown;
    };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * 곧 만료되거나 없는 Access Token이면 재발급해서 돌려준다.
 * API 요청은 401 응답 때 재발급하지만, WebSocket 연결처럼 직접 토큰을 실어 보내는 곳은 이 함수로 미리 확인한다.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) {
    const expiresAt = getAccessTokenExpiry(token);
    if (expiresAt === null || expiresAt - Date.now() > ACCESS_TOKEN_REFRESH_MARGIN_MS) {
      return token;
    }
  }
  return refreshAccessTokenOnce();
}

/** POST /api/auth/logout — 현재 Refresh Token을 폐기하고 메모리의 Access Token을 제거한다. */
export async function logoutSession(): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/auth/logout`, null, {
      withCredentials: true,
      timeout: AUTH_REQUEST_TIMEOUT_MS,
    });
  } finally {
    setAccessToken(null);
  }
}

/** GET /api/auth/oauth/authorize로 이동하는 전체 페이지 리다이렉트 URL. returnTo는 "/" 또는 초대 링크만 허용된다. */
export function buildKakaoLoginUrl(returnTo = '/'): string {
  return `${API_BASE_URL}/auth/oauth/authorize?returnTo=${encodeURIComponent(returnTo)}`;
}
