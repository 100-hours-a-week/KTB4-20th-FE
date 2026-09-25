import { isAxiosError } from 'axios';
import apiClient from './client';
import type { ApiResponse } from './types';

// GET /api/regional-chat-rooms — planit-docs/docs/CHAT_API_SPEC.md 3장
export interface RegionalChatRoomItem {
  roomId: string;
  regionId: string;
  name: string;
  memberCount: number;
  activeUserCount: number;
  relatedToMyTrip: boolean;
  joined: boolean;
  canJoin: boolean;
}

export interface RegionalChatRoomPage {
  nextCursor: string | null;
  hasNext: boolean;
}

export interface RegionalChatRoomListData {
  items: RegionalChatRoomItem[];
  page: RegionalChatRoomPage;
}

export async function fetchRegionalChatRooms(
  cursor?: string,
): Promise<RegionalChatRoomListData> {
  const response = await apiClient.get<ApiResponse<RegionalChatRoomListData>>(
    '/regional-chat-rooms',
    { params: cursor ? { cursor } : undefined },
  );
  return response.data.data;
}

// PUT /api/regional-chat-rooms/{roomId}/members/me — CHAT_API_SPEC.md 6장
export interface RegionalChatRoomJoinData {
  roomId: string;
  joinedAt: string;
}

export async function joinRegionalChatRoom(
  roomId: string,
): Promise<RegionalChatRoomJoinData> {
  const response = await apiClient.put<ApiResponse<RegionalChatRoomJoinData>>(
    `/regional-chat-rooms/${roomId}/members/me`,
  );
  return response.data.data;
}

// GET /api/chat-policy — CHAT_API_SPEC.md 4장
export interface ChatPolicy {
  policyVersionId: string;
  version: string;
  title: string;
  content: string;
  effectiveAt: string;
  consented: boolean;
  consentedAt: string | null;
}

export async function fetchChatPolicy(): Promise<ChatPolicy> {
  const response = await apiClient.get<ApiResponse<ChatPolicy>>('/chat-policy');
  return response.data.data;
}

// PUT /api/chat-policy/consent — CHAT_API_SPEC.md 5장
export interface ChatPolicyConsentData {
  policyVersionId: string;
  consentedAt: string;
}

export async function consentToChatPolicy(
  policyVersionId: string,
): Promise<ChatPolicyConsentData> {
  const response = await apiClient.put<ApiResponse<ChatPolicyConsentData>>('/chat-policy/consent', {
    policyVersionId,
  });
  return response.data.data;
}

/** axios 오류 응답에서 공통 응답 envelope의 `code`를 꺼낸다. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}
