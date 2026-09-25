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

// DELETE /api/regional-chat-rooms/{roomId}/members/me — CHAT_API_SPEC.md 7장
export interface RegionalChatRoomLeaveData {
  roomId: string;
  leftAt: string;
}

export async function leaveRegionalChatRoom(roomId: string): Promise<RegionalChatRoomLeaveData> {
  const response = await apiClient.delete<ApiResponse<RegionalChatRoomLeaveData>>(
    `/regional-chat-rooms/${roomId}/members/me`,
  );
  return response.data.data;
}

// GET /api/regional-chat-rooms/{roomId}/messages — CHAT_API_SPEC.md 8장
export interface ChatMessageSender {
  publicId?: string;
  userName: string;
  profileImageUrl?: string;
}

export interface ChatMessageImage {
  imageFileId: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
}

export interface ChatMessageItem {
  messageId: string;
  clientMessageId: string;
  messageType: 'TEXT' | 'IMAGE';
  text: string | null;
  image: ChatMessageImage | null;
  sender: ChatMessageSender;
  createdAt: string;
}

export interface ChatMessagePage {
  nextCursor: string | null;
  nextAfterMessageId: string | null;
  hasNext: boolean;
}

export interface ChatMessageHistoryData {
  items: ChatMessageItem[];
  page: ChatMessagePage;
}

export async function fetchChatMessages(
  roomId: string,
  params: { cursor?: string; afterMessageId?: string } = {},
): Promise<ChatMessageHistoryData> {
  const response = await apiClient.get<ApiResponse<ChatMessageHistoryData>>(
    `/regional-chat-rooms/${roomId}/messages`,
    { params },
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
