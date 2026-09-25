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
