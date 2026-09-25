import apiClient from './client';
import type { ApiResponse } from './types';

export interface CurrentUser {
  publicId: string;
  userName: string;
  profileImageUrl: string | null;
}

/** 로그인한 사용자 정보를 조회합니다. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<ApiResponse<CurrentUser>>('/users/me');
  return response.data.data;
}

/** 회원 탈퇴합니다. 백엔드가 Refresh Token 쿠키도 함께 삭제합니다. */
export async function withdraw(): Promise<void> {
  await apiClient.delete('/users/me', { withCredentials: true });
}
