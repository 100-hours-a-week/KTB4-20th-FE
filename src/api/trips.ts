import apiClient from './client';
import type { ApiResponse } from './types';

export type TripStatus =
  'SURVEY_IN_PROGRESS' | 'SCHEDULE_COMPLETED' | 'TRIP_IN_PROGRESS' | 'TRIP_COMPLETED';

export interface TripMemberSummary {
  userName: string;
  profileImageUrl: string | null;
}

export interface TripSummary {
  tripId: string;
  name: string;
  /** YYYY-MM-DD */
  startDate: string;
  status: TripStatus;
  memberCount: number;
  members: TripMemberSummary[];
}

export interface TripListPage {
  trips: TripSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * 참여 중인 여행방 목록을 조회합니다.
 * 정렬(다가오는 여행 우선, 출발일 오름차순)은 백엔드가 처리합니다.
 */
export async function getTrips(params: { cursor?: string; size: number }): Promise<TripListPage> {
  const response = await apiClient.get<ApiResponse<TripListPage>>('/trips', { params });
  return response.data.data;
}

/** 여행방에서 나갑니다. 방장이 나가면 다음 멤버에게 방장이 넘어갑니다. */
export async function leaveTrip(tripId: string): Promise<void> {
  await apiClient.delete(`/trips/${encodeURIComponent(tripId)}/members/me`);
}

/** 혼자 남은 방장은 나갈 수 없을 때 백엔드가 보내는 오류 코드 */
export const HOST_CANNOT_LEAVE_ALONE = 'HOST_CANNOT_LEAVE_ALONE';

export interface TripCreateRequest {
  name: string;
  /** GET /api/regions 의 regionId */
  regionId: number;
  /** YYYY-MM-DD */
  startDate: string;
  capacity: number;
  /** YYYY-MM-DD. 비우면 백엔드가 여행 전날로 정하고, 여행 당일이면 당일 12시로 고정합니다. */
  surveyDeadlineDate?: string;
}

export interface TripCreateResponse {
  tripId: string;
  invitationToken: string;
}

/** 여행방을 만들고, 만든 사람을 방장으로 등록합니다. */
export async function createTrip(request: TripCreateRequest): Promise<TripCreateResponse> {
  const response = await apiClient.post<ApiResponse<TripCreateResponse>>('/trips', request);
  return response.data.data;
}

/** 이미 같은 날짜에 참여 중인 여행이 있을 때 백엔드가 보내는 오류 코드 */
export const TRIP_DATE_CONFLICT = 'TRIP_DATE_CONFLICT';

/** 초대 링크 주소를 만듭니다. 백엔드는 `/invitations/{토큰}` 경로를 초대 링크로 인식합니다. */
export function getInvitationUrl(invitationToken: string): string {
  return `${window.location.origin}/invitations/${invitationToken}`;
}

/** 백엔드가 받는 초대 토큰 형식 (43자리 영문·숫자·_·-) */
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isValidInvitationToken(token: string): boolean {
  return INVITATION_TOKEN_PATTERN.test(token);
}

export interface TripJoinResponse {
  tripId: string;
}

/** 여행방 참여 요청이 이 시간 안에 끝나지 않으면 다시 시도합니다. (설계서 6-c) */
const JOIN_TIMEOUT_MS = 3000;

/** 초대 토큰으로 여행방에 참여합니다. */
export async function joinTrip(invitationToken: string): Promise<TripJoinResponse> {
  const response = await apiClient.post<ApiResponse<TripJoinResponse>>(
    '/trips/join',
    { invitationToken },
    { timeout: JOIN_TIMEOUT_MS },
  );
  return response.data.data;
}

/** 참여 실패 시 백엔드가 보내는 오류 코드 */
export const TRIP_JOIN_ERROR_CODES = {
  /** 토큰이 없거나, 방이 삭제됐거나, 이미 끝난 여행일 때 (백엔드가 구분하지 않음) */
  notFound: 'RESOURCE_NOT_FOUND',
  alreadyJoined: 'TRIP_ALREADY_JOINED',
  capacityExceeded: 'TRIP_CAPACITY_EXCEEDED',
  dateConflict: TRIP_DATE_CONFLICT,
} as const;

export type TripMemberRole = 'HOST' | 'MEMBER';

export interface TripDetail {
  tripId: string;
  name: string;
  region: {
    regionId: string;
    regionCode: string;
    regionName: string;
  };
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  capacity: number;
  memberCount: number;
  myRole: TripMemberRole;
  surveyDeadlineAt: string;
  createdAt: string;
  /** 참여한 순서대로 옵니다. */
  members: {
    userPublicId: string;
    userName: string;
    profileImageUrl: string | null;
    role: TripMemberRole;
  }[];
}

/** 여행방 상세를 조회합니다. 참여 중인 멤버만 볼 수 있어요. */
export async function getTripDetail(tripId: string): Promise<TripDetail> {
  const response = await apiClient.get<ApiResponse<TripDetail>>(
    `/trips/${encodeURIComponent(tripId)}`,
  );
  return response.data.data;
}

/** 여행방 상세 조회에서 참여자가 아니거나 없는 방일 때 백엔드가 보내는 오류 코드 */
export const TRIP_DETAIL_ERROR_CODES = {
  memberRequired: 'TRIP_MEMBER_REQUIRED',
  notFound: 'TRIP_NOT_FOUND',
} as const;
