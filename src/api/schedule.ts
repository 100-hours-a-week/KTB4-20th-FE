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
  /** 아직 확정된 일정이 없을 때 (일정 생성 전) */
  notFound: 'ACTIVE_SCHEDULE_NOT_FOUND',
} as const;

// GET /api/trips/{tripId}/schedule — SCHEDULE_API_SPEC.md 3장(생성 일정 조회) 계약과 같은 모양입니다.
export interface ScheduleStop {
  stopId: string;
  placeId: string;
  order: number;
  name: string;
  categoryName: string | null;
  address: string | null;
  roadAddress: string | null;
  latitude: number;
  longitude: number;
  selectionReason: string | null;
}

export interface ScheduleLeg {
  legId: string;
  fromStopId: string;
  toStopId: string;
  order: number;
  distanceMeters: number;
}

export interface ScheduleDay {
  dayId: string;
  dayNumber: number;
  /** YYYY-MM-DD */
  date: string;
  totalDistanceMeters: number;
  stops: ScheduleStop[];
  legs: ScheduleLeg[];
}

export interface ScheduleDetail {
  tripId: string;
  scheduleId: string;
  strategy: string;
  status: string;
  /** V1은 일정을 수정할 수 없어서 항상 false예요. */
  editable: boolean;
  totalDistanceMeters: number;
  createdAt: string;
  days: ScheduleDay[];
}

/** GET /api/trips/{tripId}/schedule — 여행방 활성 멤버만 조회할 수 있어요. */
export async function getSchedule(tripId: string): Promise<ScheduleDetail> {
  const response = await apiClient.get<ApiResponse<ScheduleDetail>>(
    `/trips/${encodeURIComponent(tripId)}/schedule`,
  );
  return response.data.data;
}
