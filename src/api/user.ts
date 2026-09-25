import apiClient from './client';
import type { ApiResponse } from './types';

// GET /api/users/me
export interface CurrentUser {
  publicId: string;
  userName: string;
  profileImageUrl: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<ApiResponse<CurrentUser>>('/users/me');
  return response.data.data;
}

// DELETE /api/users/me — 회원 탈퇴. 백엔드가 Refresh Token 쿠키도 함께 삭제한다.
export async function withdrawUser(): Promise<void> {
  await apiClient.delete('/users/me');
}
