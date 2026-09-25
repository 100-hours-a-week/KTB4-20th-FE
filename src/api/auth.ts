import apiClient from './client';
import type { ApiResponse } from './types';

/** 로그인 실패 시 백엔드가 `/login?error=` 로 전달하는 오류 코드 */
export const OAUTH_ERROR_CODES = {
  accessDenied: 'OAUTH_ACCESS_DENIED',
} as const;

/** 백엔드가 로그인 후 돌아갈 경로로 허용하는 형식 (`/` 또는 초대 링크) */
const RETURN_TO_PATTERN = /^\/(invitations\/[A-Za-z0-9_-]{43})?$/;

export function isValidReturnTo(path: string): boolean {
  return RETURN_TO_PATTERN.test(path);
}

/**
 * 카카오 로그인을 시작하는 백엔드 주소를 반환합니다.
 * 이 주소로 페이지를 이동하면 백엔드가 카카오 인가 화면으로 리다이렉트하고,
 * 로그인 성공 시 `returnTo` 경로로 돌려보냅니다.
 */
export function getKakaoLoginUrl(returnTo = '/'): string {
  const params = new URLSearchParams({ returnTo: isValidReturnTo(returnTo) ? returnTo : '/' });
  return `${import.meta.env.VITE_API_BASE_URL}/auth/oauth/authorize?${params.toString()}`;
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Refresh Token 쿠키로 새 Access Token을 발급받습니다. */
export async function refreshAccessToken(): Promise<AccessTokenResponse> {
  const response = await apiClient.post<ApiResponse<AccessTokenResponse>>('/auth/refresh', null, {
    withCredentials: true,
  });
  return response.data.data;
}

/** 서버의 Refresh Token을 폐기하고 쿠키를 삭제합니다. */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', null, { withCredentials: true });
}
