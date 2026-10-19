import apiClient from './client';
import type { ApiResponse } from './types';

/*
  포토미션 API입니다. 백엔드 PhotoMissionController 계약과 같은 모양이에요.
  미션 문구(description)는 AI가 20자 안팎의 명사형("다보탑 정면 찍기")으로 만들어서 화면에서는 제목으로 씁니다.
  placeName(미션 장소 이름)은 백엔드에 추가를 요청한 필드라 오기 전까지는 비어 있을 수 있어요.
*/

export type PhotoMissionScope = 'PERSONAL' | 'GROUP';
/** 개인형은 내 완료 여부, 그룹형은 그룹 완료 여부예요. */
export type PhotoMissionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PhotoMissionCompletionMethod = 'AI' | 'MANUAL';

export interface PhotoMissionDayTab {
  dayNumber: number;
  /** YYYY-MM-DD */
  date: string;
  /** 미래 Day는 false라 고를 수 없어요. */
  selectable: boolean;
  selected: boolean;
}

export interface PhotoMissionCard {
  missionId: number;
  missionOrder: number;
  scope: PhotoMissionScope;
  description: string;
  primaryCategory: string | null;
  placeName?: string | null;
  status: PhotoMissionStatus;
  /** 완료한 미션의 제출 사진. 미완료면 null이에요. */
  thumbnailUrl: string | null;
  /** 개인형에서만 와요. */
  completedMemberCount: number | null;
  totalMemberCount: number | null;
  /** 그룹형이 완료됐을 때만 와요. */
  completedBy: { userId: string; username: string; completedAt: string } | null;
}

export interface PhotoMissionList {
  trip: {
    tripId: number;
    name: string;
    startDate: string;
    endDate: string;
    memberCount: number;
  };
  days: PhotoMissionDayTab[];
  selectedDay: {
    dayNumber: number;
    date: string;
    /** 그날 미션 공개 시각(0시 30분)이 지났는지 */
    published: boolean;
    completedMissionCount: number;
    totalMissionCount: number;
    completed: boolean;
    nextDayExists: boolean;
    missions: PhotoMissionCard[];
  };
}

/** Day를 비우면 백엔드가 오늘(여행 전이면 Day 1, 끝났으면 마지막 Day)을 골라요. */
export async function getPhotoMissions(tripId: string, day?: number): Promise<PhotoMissionList> {
  const response = await apiClient.get<ApiResponse<PhotoMissionList>>(
    `/trips/${encodeURIComponent(tripId)}/photomissions`,
    { params: day ? { day } : undefined },
  );
  return response.data.data;
}

export interface PhotoMissionMember {
  tripMemberId: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  me: boolean;
  status: PhotoMissionStatus;
  completedAt: string | null;
}

export interface PhotoMissionPhoto {
  photoId: number;
  imageUrl: string;
  submittedByUserId: string;
  submittedByUsername: string;
  /** 그룹형에서 가장 먼저 완료한 사진이에요. */
  representative: boolean;
  submittedAt: string;
}

export interface PhotoMissionDetail {
  missionId: number;
  dayNumber: number;
  date: string;
  scope: PhotoMissionScope;
  description: string;
  primaryCategory: string | null;
  placeName?: string | null;
  /** 여행이 끝나 더 제출할 수 없으면 true */
  expired: boolean;
  status: PhotoMissionStatus;
  /** 성공하지 못한 판정 횟수. 3번을 넘기면 직접 완료할 수 있어요. */
  retryCount: number;
  completionMethod: PhotoMissionCompletionMethod | null;
  completedAt: string | null;
  members: PhotoMissionMember[];
  photos: PhotoMissionPhoto[];
}

export async function getPhotoMissionDetail(missionId: number): Promise<PhotoMissionDetail> {
  const response = await apiClient.get<ApiResponse<PhotoMissionDetail>>(
    `/photomissions/${missionId}`,
  );
  return response.data.data;
}

export type PhotoVerifyResult = 'success' | 'retry' | 'fail';

/** AI 판정 결과입니다. 백엔드가 AI 응답을 이름(snake_case)과 값(소문자)까지 그대로 넘겨요. */
export interface PhotoVerifyResponse {
  result: PhotoVerifyResult;
  /** 사진 위치가 미션 장소와 멀어 바로 반려됐으면 'location_mismatch' */
  reason: string | null;
  match_score: number;
  detected_labels: { name: string; matched: boolean }[];
  /** 장소를 알아본 신뢰도. 기준보다 낮으면 null이에요. */
  landmark_confidence: number | null;
  /** RETRY일 때만 와요. */
  retry_hint: string | null;
}

export interface PhotoCoordinates {
  latitude: number;
  longitude: number;
}

/** AI 판정은 백엔드가 최대 30초까지 기다려서, 사진 제출만 기본(10초)보다 길게 기다립니다. */
const PHOTO_SUBMIT_TIMEOUT_MS = 40_000;

function photoFormData(photo: Blob, coordinates: PhotoCoordinates | null): FormData {
  const form = new FormData();
  form.append('photo', photo, 'photo.jpg');
  if (coordinates) {
    form.append('latitude', String(coordinates.latitude));
    form.append('longitude', String(coordinates.longitude));
  }
  return form;
}

/**
 * apiClient의 기본 Content-Type(JSON)이 남아 있으면 axios가 FormData를 JSON으로 바꿔 보내요.
 * multipart로 지정하면 브라우저가 경계(boundary)를 붙인 값으로 다시 채워요.
 */
function multipartConfig(idempotencyKey: string) {
  return {
    timeout: PHOTO_SUBMIT_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data', 'Idempotency-Key': idempotencyKey },
  };
}

/** 사진을 제출하고 AI 판정 결과를 받아요. 다시 찍기도 같은 API예요(기존 사진을 바꿔요). */
export async function submitMissionPhoto(
  missionId: number,
  photo: Blob,
  coordinates: PhotoCoordinates | null,
  idempotencyKey: string,
): Promise<PhotoVerifyResponse> {
  const response = await apiClient.post<ApiResponse<PhotoVerifyResponse>>(
    `/photomissions/${missionId}/photos`,
    photoFormData(photo, coordinates),
    multipartConfig(idempotencyKey),
  );
  const data = response.data.data;
  return { ...data, result: data.result.toLowerCase() as PhotoVerifyResult };
}

/** 이미 완료한 그룹 미션에 사진을 더 올려요. 판정 없이 바로 추가돼요. */
export async function addGroupMissionPhoto(
  missionId: number,
  photo: Blob,
  coordinates: PhotoCoordinates | null,
  idempotencyKey: string,
): Promise<{ photoId: number }> {
  const response = await apiClient.post<ApiResponse<{ photoId: number }>>(
    `/photomissions/${missionId}/photos/additional`,
    photoFormData(photo, coordinates),
    multipartConfig(idempotencyKey),
  );
  return response.data.data;
}

/** 내가 올린 사진을 지워요. */
export async function deleteMissionPhoto(missionId: number, photoId: number): Promise<void> {
  await apiClient.delete(`/photomissions/${missionId}/photos/${photoId}`);
}

/** 판정을 여러 번 실패한 뒤 미션을 직접 완료해요. */
export async function completeMissionManually(missionId: number): Promise<void> {
  await apiClient.post(`/photomissions/${missionId}/manual-completion`);
}

export interface PhotoMissionAlbumItem {
  missionId: number;
  scope: PhotoMissionScope;
  description: string;
  primaryCategory: string | null;
  placeName?: string | null;
  thumbnailUrl: string;
  photoCount: number;
  submittedBy: { userId: string; username: string } | null;
}

export interface PhotoMissionAlbum {
  tripId: number;
  tripName: string;
  completedMissionCount: number;
  totalPhotoCount: number;
  days: {
    dayNumber: number;
    date: string;
    personalMissions: PhotoMissionAlbumItem[];
    groupMissions: PhotoMissionAlbumItem[];
  }[];
}

export async function getPhotoMissionAlbum(tripId: string): Promise<PhotoMissionAlbum> {
  const response = await apiClient.get<ApiResponse<PhotoMissionAlbum>>(
    `/trips/${encodeURIComponent(tripId)}/photomissions/album`,
  );
  return response.data.data;
}

export interface PhotoMissionCompletion {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  /** DAY면 그날, TRIP이면 여행 전체 기준이에요. */
  scope: 'DAY' | 'TRIP' | string;
  dayNumber: number | null;
  date: string | null;
  completedMissionCount: number;
  totalMissionCount: number;
  incompleteMissionCount: number;
  totalPhotoCount: number;
  landmarkCount: number;
  completed: boolean;
  tripEnded: boolean;
  nextDayExists: boolean;
  previewPhotos: { photoId: number; imageUrl: string }[];
}

/** Day를 주면 그날 결과, 비우면 여행 전체 결과예요. */
export async function getPhotoMissionCompletion(
  tripId: string,
  day?: number,
): Promise<PhotoMissionCompletion> {
  const response = await apiClient.get<ApiResponse<PhotoMissionCompletion>>(
    `/trips/${encodeURIComponent(tripId)}/photomissions/completion`,
    { params: day ? { day } : undefined },
  );
  return response.data.data;
}

export interface PhotoMissionPhotoDetail {
  photoId: number;
  imageUrl: string;
  submittedAt: string;
  representative: boolean;
  mission: {
    missionId: number;
    scope: PhotoMissionScope;
    description: string;
    primaryCategory: string | null;
  };
  /** 미션 장소. 장소가 없는 미션이면 null이에요. */
  place: { placeId: string; placeName: string } | null;
  submittedBy: { userId: string; username: string };
}

/** 완료 사진 한 장의 상세. 개인 사진은 올린 사람만, 그룹 사진은 여행방 멤버가 볼 수 있어요. */
export async function getMissionPhotoDetail(
  missionId: number,
  photoId: number,
): Promise<PhotoMissionPhotoDetail> {
  const response = await apiClient.get<ApiResponse<PhotoMissionPhotoDetail>>(
    `/photomissions/${missionId}/photos/${photoId}`,
  );
  return response.data.data;
}

/** 포토미션에서 백엔드가 보내는 오류 코드 */
export const PHOTO_MISSION_ERROR_CODES = {
  notFound: 'RESOURCE_NOT_FOUND',
  tripNotFound: 'TRIP_NOT_FOUND',
  memberRequired: 'TRIP_MEMBER_REQUIRED',
  submissionNotAllowed: 'PHOTO_MISSION_SUBMISSION_NOT_ALLOWED',
  manualCompletionNotAllowed: 'PHOTO_MISSION_MANUAL_COMPLETION_NOT_ALLOWED',
  /** 같은 제출 키로 다시 보냈을 때. 결과는 상세를 다시 불러와 확인해요. */
  idempotencyKeyReused: 'PHOTO_MISSION_IDEMPOTENCY_KEY_REUSED',
} as const;
