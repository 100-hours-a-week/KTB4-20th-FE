import apiClient from './client';
import type { ScheduleDay } from './schedule';
import type { ApiResponse } from './types';

/*
  AI 일정 생성은 최단거리 · 취향 우선 · 다양성 3가지 후보(DRAFT)를 만들고,
  방장이 그중 하나를 확정해야 여행 일정(GET /api/trips/{tripId}/schedule)이 생깁니다.
*/

export type CourseStrategy = 'SHORTEST' | 'PREFERENCE' | 'DIVERSITY';

export interface ScheduleCandidateSummary {
  scheduleId: string;
  strategy: CourseStrategy;
  /** 백엔드가 전략별로 정해 주는 한 줄 설명 */
  summary: string;
  /** 코스에 담긴 그룹 취향 장소 수. 최단거리 코스는 null */
  preferenceCount: number | null;
  /** 코스에 담긴 새로 발견한 장소 수. 최단거리 코스는 null */
  discoveryCount: number | null;
  totalDistanceMeters: number;
}

export interface ScheduleCandidateDetail extends ScheduleCandidateSummary {
  tripId: string;
  /** 후보는 확정 전이라 항상 false예요. */
  editable: boolean;
  days: ScheduleDay[];
}

export interface ScheduleConfirmResult {
  tripId: string;
  scheduleId: string;
  strategy: CourseStrategy;
  status: string;
  confirmedAt: string;
}

/** 전략별 코스 이름 (백엔드는 이름을 보내지 않아요) */
export const COURSE_TITLES: Record<CourseStrategy, string> = {
  SHORTEST: '최단거리 코스',
  PREFERENCE: '취향 우선 코스',
  DIVERSITY: '다양성 코스',
};

/**
 * 코스 카드에 보여 줄 반영도 지표.
 * 취향 우선 코스는 취향 장소 비율, 다양성 코스는 발견 장소 비율을 백분율로 보여 줘요.
 * 최단거리 코스처럼 장소 수가 없으면 percent는 null이에요.
 */
export function getCourseMetric(
  course: Pick<ScheduleCandidateSummary, 'strategy' | 'preferenceCount' | 'discoveryCount'>,
): { label: string; percent: number | null } {
  const label = course.strategy === 'DIVERSITY' ? '다양성 반영도' : '취향 반영도';
  const { preferenceCount, discoveryCount } = course;
  if (preferenceCount === null || discoveryCount === null) return { label, percent: null };
  const total = preferenceCount + discoveryCount;
  if (total <= 0) return { label, percent: null };
  const count = course.strategy === 'DIVERSITY' ? discoveryCount : preferenceCount;
  return { label, percent: Math.round((count / total) * 100) };
}

/** 코스 조회·확정에서 백엔드가 보내는 오류 코드 */
export const COURSE_ERROR_CODES = {
  /** 후보 3개가 모두 있지 않을 때 (생성 전이거나 이미 확정한 뒤) */
  candidatesNotFound: 'SCHEDULE_CANDIDATES_NOT_FOUND',
  candidateNotFound: 'SCHEDULE_CANDIDATE_NOT_FOUND',
  /** 그사이 일정을 다시 만들어 고른 후보가 최신이 아닐 때 */
  candidatesSuperseded: 'SCHEDULE_CANDIDATES_SUPERSEDED',
} as const;

/** GET /api/trips/{tripId}/schedule-candidates — 여행방 활성 멤버 누구나 볼 수 있어요. 최단거리 · 취향 우선 · 다양성 순서로 와요. */
export async function getScheduleCandidates(tripId: string): Promise<ScheduleCandidateSummary[]> {
  const response = await apiClient.get<
    ApiResponse<{ tripId: string; candidates: ScheduleCandidateSummary[] }>
  >(`/trips/${encodeURIComponent(tripId)}/schedule-candidates`);
  return response.data.data.candidates;
}

/** GET /api/trips/{tripId}/schedule-candidates/{scheduleId} — 후보 한 개의 날짜별 동선 */
export async function getScheduleCandidate(
  tripId: string,
  scheduleId: string,
): Promise<ScheduleCandidateDetail> {
  const response = await apiClient.get<ApiResponse<ScheduleCandidateDetail>>(
    `/trips/${encodeURIComponent(tripId)}/schedule-candidates/${encodeURIComponent(scheduleId)}`,
  );
  return response.data.data;
}

/** PUT /api/trips/{tripId}/schedule — 방장만, 여행 시작 10분 전(전날 23:50)까지 확정할 수 있어요. */
export async function confirmSchedule(
  tripId: string,
  scheduleId: string,
): Promise<ScheduleConfirmResult> {
  const response = await apiClient.put<ApiResponse<ScheduleConfirmResult>>(
    `/trips/${encodeURIComponent(tripId)}/schedule`,
    { scheduleId: Number(scheduleId) },
  );
  return response.data.data;
}
