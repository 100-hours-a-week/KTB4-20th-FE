import apiClient from './client';
import type { ApiResponse } from './types';

export interface InvitationPreview {
  trip: {
    tripId: string;
    name: string;
    region: { regionId: string; regionName: string };
    /** YYYY-MM-DD */
    startDate: string;
    endDate: string;
    memberCount: number;
    capacity: number;
  };
  inviter: { publicId: string; userName: string; profileImageUrl: string | null };
  members: { userName: string; profileImageUrl: string | null }[];
  alreadyJoined: boolean;
  /** 같은 날짜에 이미 참여 중인 내 여행방. 없으면 null */
  conflictingTrip: { tripId: string; name: string } | null;
}

/** 초대 미리보기 API가 보내는 오류 코드 */
export const INVITATION_ERROR_CODES = {
  notFound: 'INVITATION_NOT_FOUND',
  tripDeleted: 'INVITATION_TRIP_DELETED',
  expired: 'INVITATION_EXPIRED',
  surveyClosed: 'SURVEY_CLOSED',
  /** 로그인 없이 호출했을 때: 링크는 유효하고, 자세한 정보는 로그인해야 볼 수 있다는 뜻 */
  authenticationRequired: 'AUTHENTICATION_REQUIRED',
} as const;

/** 미리보기 요청이 이 시간 안에 끝나지 않으면 다시 시도합니다. (설계서 6-c) */
const PREVIEW_TIMEOUT_MS = 3000;

/**
 * 초대 링크 정보를 조회합니다.
 * - `withAuth: false`: 링크가 유효한지만 확인합니다. 만료됐을 수 있는 로그인 토큰을 보내지 않습니다.
 *   유효하면 백엔드가 `AUTHENTICATION_REQUIRED`(401)로 답합니다.
 * - `withAuth: true`: 로그인 토큰을 붙여서 여행 정보와 참여 여부까지 받습니다.
 */
export async function getInvitationPreview(
  invitationToken: string,
  { withAuth }: { withAuth: boolean },
): Promise<InvitationPreview> {
  const response = await apiClient.get<ApiResponse<InvitationPreview>>(
    `/invitations/${encodeURIComponent(invitationToken)}`,
    { skipAuth: !withAuth, timeout: PREVIEW_TIMEOUT_MS },
  );
  return response.data.data;
}
