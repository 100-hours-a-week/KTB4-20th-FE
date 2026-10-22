import apiClient from './client';
import type { ApiResponse } from './types';

/**
 * AI 일정 생성은 AI 장소 선정과 동선 계산이 끝날 때까지 응답이 오지 않습니다.
 * 기본 요청 제한 시간(10초)보다 넉넉하게 기다리고, 넘으면 처리 시간 초과로 봅니다.
 */
const SCHEDULE_GENERATION_TIMEOUT_MS = 120_000;

/** 생성 결과는 후보 3개로 저장돼요. 화면은 응답 대신 GET /schedule-candidates로 후보를 다시 불러와요. */
export interface ScheduleGenerationResult {
  tripId: string;
  places: unknown[][];
}

/**
 * 일정 생성 사유. 확정 일정이 이미 있으면 지우고 새 후보 3개를 만들어요. (다시 코스를 골라야 해요)
 * GENERAL 재생성은 여행당 5회까지이고, 이상 기후 알림으로 바꾸는 WEATHER는 횟수에서 빠져요.
 */
export type ScheduleGenerationReason = 'GENERAL' | 'WEATHER';

/** POST /api/trips/{tripId}/schedule-generation — 방장만 요청할 수 있어요. 성공하면 후보 3개(DRAFT)가 생겨요. */
export async function generateSchedule(
  tripId: string,
  reason: ScheduleGenerationReason = 'GENERAL',
): Promise<ScheduleGenerationResult> {
  const response = await apiClient.post<ApiResponse<ScheduleGenerationResult>>(
    `/trips/${encodeURIComponent(tripId)}/schedule-generation`,
    { reason },
    { timeout: SCHEDULE_GENERATION_TIMEOUT_MS },
  );
  return response.data.data;
}

/** AI 일정 생성에서 백엔드가 보내는 오류 코드 */
export const SCHEDULE_ERROR_CODES = {
  alreadyExists: 'SCHEDULE_ALREADY_EXISTS',
  /** 확정하지 않은 코스 후보가 있을 때. 후보를 고르기 전에는 다시 만들 수 없어요. */
  candidatesPending: 'SCHEDULE_CANDIDATES_PENDING',
  notReady: 'SCHEDULE_GENERATION_NOT_READY',
  accessDenied: 'ACCESS_DENIED',
  hostRequired: 'TRIP_HOST_REQUIRED',
  /** 일반 재생성 5회를 모두 썼을 때 */
  regenerationLimitExceeded: 'SCHEDULE_REGENERATION_LIMIT_EXCEEDED',
  /** 일정을 바꿀 수 있는 기한(여행 시작 10분 전)이 지났을 때 */
  changeNotAllowed: 'SCHEDULE_CHANGE_NOT_ALLOWED',
  /** 바꿀 일정이 없거나 이상 기후 알림을 받은 여행이 아닐 때 */
  weatherReplanNotAvailable: 'WEATHER_REPLAN_NOT_AVAILABLE',
  /** 아직 확정된 일정이 없을 때 (일정 생성 전) */
  notFound: 'ACTIVE_SCHEDULE_NOT_FOUND',
  /** 그날 장소가 최소 개수(getScheduleMinStops)라서 더 지울 수 없을 때 */
  minimumStopsRequired: 'SCHEDULE_MINIMUM_STOPS_REQUIRED',
  /** 그날 장소가 이미 10개일 때 */
  maximumStopsExceeded: 'SCHEDULE_MAXIMUM_STOPS_EXCEEDED',
  /** 같은 장소가 이미 일정에 있을 때 */
  placeAlreadyExists: 'SCHEDULE_PLACE_ALREADY_EXISTS',
  dayNotFound: 'SCHEDULE_DAY_NOT_FOUND',
  stopNotFound: 'SCHEDULE_STOP_NOT_FOUND',
} as const;

/** 하루(일차)에 둘 수 있는 장소 수 범위 — 백엔드 ScheduleDayPlacePolicy · ScheduleServiceImpl과 같은 값 */
export const SCHEDULE_MIN_STOPS = 3;
/** 여러 날 여행의 마지막 날은 AI가 장소를 2개만 줄 수 있어서 최소 개수가 더 적어요. */
export const SCHEDULE_LAST_DAY_MIN_STOPS = 2;
export const SCHEDULE_MAX_STOPS = 10;

/** 그날 남겨야 하는 최소 장소 수. 여러 날 여행의 마지막 날만 2개, 나머지는 3개예요. */
export function getScheduleMinStops(dayNumber: number, dayCount: number): number {
  return dayCount >= 2 && dayNumber === dayCount ? SCHEDULE_LAST_DAY_MIN_STOPS : SCHEDULE_MIN_STOPS;
}

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
  /** 지금 방장이 변경 기한(여행 시작 10분 전) 전에 볼 때만 true예요. 장소 추가·제거 버튼은 이 값으로 보여줘요. */
  editable: boolean;
  totalDistanceMeters: number;
  confirmedAt: string;
  /** 날씨 사유를 뺀 일반 재생성 남은 횟수 (0~5) */
  remainingRegenerations: number;
  days: ScheduleDay[];
}

/** GET /api/trips/{tripId}/schedule — 여행방 활성 멤버만 조회할 수 있어요. */
export async function getSchedule(tripId: string): Promise<ScheduleDetail> {
  const response = await apiClient.get<ApiResponse<ScheduleDetail>>(
    `/trips/${encodeURIComponent(tripId)}/schedule`,
  );
  return response.data.data;
}

export interface ScheduleStopAddRequest {
  scheduleDayId: number;
  /** 1부터 시작하는 끼워 넣을 방문 순서 */
  position: number;
  place: {
    googlePlaceId: string;
    name: string;
    categoryName?: string | null;
    address?: string | null;
    roadAddress?: string | null;
    longitude: number;
    latitude: number;
    phone?: string | null;
    placeUrl?: string | null;
  };
}

export interface ScheduleStopChangeResponse {
  scheduleId: string;
  /** 바뀐 일차 전체 (장소 순서와 이동 거리가 다시 계산돼 와요) */
  day: ScheduleDay;
}

/** POST /api/trips/{tripId}/schedule/stops — 방장만, 여행 시작 10분 전까지 추가할 수 있어요. */
export async function addScheduleStop(
  tripId: string,
  request: ScheduleStopAddRequest,
): Promise<ScheduleStopChangeResponse> {
  const response = await apiClient.post<ApiResponse<ScheduleStopChangeResponse>>(
    `/trips/${encodeURIComponent(tripId)}/schedule/stops`,
    request,
  );
  return response.data.data;
}

/** DELETE /api/trips/{tripId}/schedule/stops/{stopId} — 방장만, 여행 시작 10분 전까지 지울 수 있어요. */
export async function deleteScheduleStop(
  tripId: string,
  stopId: string,
): Promise<ScheduleStopChangeResponse & { deletedStopId: string }> {
  const response = await apiClient.delete<
    ApiResponse<ScheduleStopChangeResponse & { deletedStopId: string }>
  >(`/trips/${encodeURIComponent(tripId)}/schedule/stops/${encodeURIComponent(stopId)}`);
  return response.data.data;
}
