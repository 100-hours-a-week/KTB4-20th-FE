import apiClient from './client';
import type { ApiResponse } from './types';

// NOTIFICATION_API_SPEC.md 계약과 같은 모양입니다.

export type NotificationType = 'TRIP_D1' | 'TRIP_WEATHER_ALERT';

/** 이상 기후 알림의 대표 날씨. 백엔드가 알 수 없는 날씨면 null이 와요. (명세 10절) */
export type WeatherCondition =
  'TYPHOON' | 'HEAVY_RAIN' | 'HEAVY_SNOW' | 'HEAT' | 'COLD' | 'RAIN' | 'YELLOW_DUST' | 'FINE_DUST';

export interface NotificationTarget {
  type: 'TRIP';
  id: string;
}

export interface NotificationListItem {
  notificationId: string;
  type: NotificationType;
  weatherCondition: WeatherCondition | null;
  title: string;
  body: string;
  /** 이동 대상이 없는 안내 알림이면 null이에요. */
  target: (NotificationTarget & { status: 'ACTIVE' | 'EXPIRED' }) | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListPage {
  items: NotificationListItem[];
  page: { nextCursor: string | null; hasNext: boolean };
}

/** 실시간(WebSocket)과 미전달 복구(pending) 알림을 화면에서 같은 모양으로 다루기 위한 타입 */
export interface IncomingNotification {
  notificationId: string;
  type: NotificationType;
  weatherCondition: WeatherCondition | null;
  title: string;
  body: string;
  target: NotificationTarget | null;
  createdAt: string;
}

/** GET /api/notifications — 처음엔 20개, 이후 cursor로 10개씩 와요. */
export async function getNotifications(cursor?: string): Promise<NotificationListPage> {
  const response = await apiClient.get<ApiResponse<NotificationListPage>>('/notifications', {
    params: cursor ? { cursor } : undefined,
  });
  return response.data.data;
}

/** GET /api/notifications/unread-count */
export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<{ unreadCount: number; hasUnread: boolean }>>(
    '/notifications/unread-count',
  );
  return response.data.data.unreadCount;
}

export interface NotificationReadResult {
  notificationId: string;
  read: boolean;
  readAt: string;
  targetStatus: 'ACTIVE' | 'EXPIRED' | null;
  navigable: boolean;
}

/** PUT /api/notifications/{id}/read — 이미 읽은 알림도 성공으로 와요. */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationReadResult> {
  const response = await apiClient.put<ApiResponse<NotificationReadResult>>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );
  return response.data.data;
}

/** PUT /api/notifications/read-all */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all');
}

/** GET /api/notifications/pending-deliveries — WebSocket 구독 뒤 당일 놓친 알림을 받아요. */
export async function getPendingNotificationDeliveries(): Promise<IncomingNotification[]> {
  const response = await apiClient.get<ApiResponse<{ items: IncomingNotification[] }>>(
    '/notifications/pending-deliveries',
  );
  return response.data.data.items;
}

/** PUT /api/notifications/{id}/delivery-ack — 알림을 화면에 반영한 뒤 호출해요. */
export async function acknowledgeNotificationDelivery(notificationId: string): Promise<void> {
  await apiClient.put(`/notifications/${encodeURIComponent(notificationId)}/delivery-ack`);
}
