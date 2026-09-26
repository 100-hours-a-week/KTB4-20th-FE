import apiClient from './client';
import type { ApiResponse } from './types';

export interface Region {
  regionId: string;
  regionCode: string;
  /** 화면에 보여줄 이름 (예: 서울, 경주) */
  regionName: string;
  latitude: number;
  longitude: number;
}

/** GET /api/regions — 여행지로 고를 수 있는 지역 목록 (AI 일정 생성을 지원하는 지역만 옵니다) */
export async function fetchRegions(): Promise<Region[]> {
  const response = await apiClient.get<ApiResponse<{ regions: Region[] }>>('/regions');
  return response.data.data.regions;
}
