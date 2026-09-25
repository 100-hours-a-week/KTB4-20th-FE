import apiClient from './client';
import type { ApiResponse } from './types';

/**
 * AI 일정 생성은 AI 장소 선정과 동선 계산이 끝날 때까지 응답이 오지 않습니다.
 * 기본 요청 제한 시간(10초)보다 넉넉하게 기다리고, 넘으면 처리 시간 초과로 봅니다.
 */
const SCHEDULE_GENERATION_TIMEOUT_MS = 120_000;

export interface ScheduleGenerationResult {
  tripId: string;
  places: unknown[];
}

/** POST /api/trips/{tripId}/schedule-generation — 방장만 요청할 수 있어요. */
export async function generateSchedule(tripId: string): Promise<ScheduleGenerationResult> {
  const response = await apiClient.post<ApiResponse<ScheduleGenerationResult>>(
    `/trips/${encodeURIComponent(tripId)}/schedule-generation`,
    null,
    { timeout: SCHEDULE_GENERATION_TIMEOUT_MS },
  );
  return response.data.data;
}

/** AI 일정 생성에서 백엔드가 보내는 오류 코드 */
export const SCHEDULE_ERROR_CODES = {
  alreadyExists: 'SCHEDULE_ALREADY_EXISTS',
  notReady: 'SCHEDULE_GENERATION_NOT_READY',
  accessDenied: 'ACCESS_DENIED',
} as const;
