import apiClient from './client';
import type { ApiResponse } from './types';

export interface RegionItem {
  regionId: string;
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
}

interface RegionListResponse {
  regions: RegionItem[];
}

/** 여행지로 고를 수 있는 지역 목록을 조회합니다. AI 일정 생성을 지원하는 지역만 내려옵니다. */
export async function getRegions(): Promise<RegionItem[]> {
  const response = await apiClient.get<ApiResponse<RegionListResponse>>('/regions');
  return response.data.data.regions;
}
