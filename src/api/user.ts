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
