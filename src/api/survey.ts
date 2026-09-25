import apiClient from './client';
import type { ApiResponse } from './types';

// GET /api/preference-questions — SCHEDULE_API_SPEC.md, planit-backend survey 패키지 기준
export interface PreferenceQuestion {
  questionId: string;
  code: string;
  categoryCode: string;
  questionText: string;
  displayOrder: number;
}

export interface SurveyExclusionCategory {
  categoryId: string;
  code: string;
  name: string;
}

export interface SurveyCatalog {
  questions: PreferenceQuestion[];
  exclusionCategories: SurveyExclusionCategory[];
}

export async function fetchSurveyCatalog(): Promise<SurveyCatalog> {
  const response = await apiClient.get<ApiResponse<SurveyCatalog>>('/preference-questions');
  return response.data.data;
}

// GET/PUT /api/trips/{tripId}/survey
export interface SurveyAnswer {
  questionId: string;
  score: number;
}

export interface Survey {
  tripId: string;
  status: 'DRAFT' | 'SUBMITTED';
  submittedAt: string | null;
  answers: SurveyAnswer[];
  excludedCategoryIds: string[];
}

export async function fetchMySurvey(tripId: string): Promise<Survey> {
  const response = await apiClient.get<ApiResponse<Survey>>(`/trips/${tripId}/survey`);
  return response.data.data;
}

export async function saveMySurvey(
  tripId: string,
  payload: { answers: SurveyAnswer[]; excludedCategoryIds: string[] },
): Promise<Survey> {
  const response = await apiClient.put<ApiResponse<Survey>>(`/trips/${tripId}/survey`, payload);
  return response.data.data;
}

// GET /api/trips/{tripId}/survey-summary — 설문 제출 현황과 그룹 취향 종합
export interface SurveySummary {
  tripId: string;
  /** ISO 시각 (서울 기준 오프셋 포함) */
  deadlineAt: string;
  activeMemberCount: number;
  submittedCount: number;
  progressPercent: number;
  allSubmitted: boolean;
  mySurveySubmitted: boolean;
  deadlinePassed: boolean;
  memberSubmissions: { userPublicId: string; submitted: boolean }[];
  /** 카테고리별 평균 점수와 선호도(1점 0% ~ 5점 100%) */
  categoryAverages: { categoryCode: string; averageScore: number; preferencePercent: number }[];
  /** "이번엔 빼드려요"에 보여줄 제외 항목 */
  excludedCategories: { code: string; name: string }[];
}

export async function fetchSurveySummary(tripId: string): Promise<SurveySummary> {
  const response = await apiClient.get<ApiResponse<SurveySummary>>(
    `/trips/${tripId}/survey-summary`,
  );
  return response.data.data;
}
