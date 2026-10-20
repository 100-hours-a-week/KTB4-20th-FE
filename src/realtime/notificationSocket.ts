import { Client } from '@stomp/stompjs';
import type {
  IncomingNotification,
  NotificationTarget,
  NotificationType,
  WeatherCondition,
} from '../api/notifications';
import { getValidAccessToken, refreshAccessTokenOnce } from '../auth/authSession';

// NOTIFICATION_API_SPEC.md 8장 — 로그인 후 서비스에 들어오면 연결하고 /user/queue/notifications를 구독한다.
const HEARTBEAT_MS = 10_000;
/** 끊기면 다시 연결하고, 다시 구독할 때마다 놓친 알림을 pending API로 복구한다. */
const RECONNECT_DELAY_MS = 5_000;
const NOTIFICATION_DESTINATION = '/user/queue/notifications';

/** WebSocket으로 오는 알림. notificationId는 숫자, 유형 필드 이름은 notificationType이다. */
interface NotificationSocketPayload {
  notificationId: number | string;
  notificationType: NotificationType;
  weatherCondition: WeatherCondition | null;
  title: string;
  body: string;
  target: NotificationTarget | null;
  createdAt: string;
}

interface NotificationSocketHandlers {
  onNotification: (notification: IncomingNotification) => void;
  /** 구독이 등록된 뒤(RECEIPT 수신) 호출된다. 재연결 때도 다시 호출된다. */
  onSubscribed: () => void;
}

function wsUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  // 배포 환경은 VITE_API_BASE_URL이 "/api"처럼 상대 경로라 현재 페이지 origin을 기준으로 푼다.
  const origin = new URL(apiBaseUrl, window.location.origin).origin;
  return `${origin.replace(/^http/, 'ws')}/ws`;
}

function toIncomingNotification(payload: NotificationSocketPayload): IncomingNotification {
  return {
    notificationId: String(payload.notificationId),
    type: payload.notificationType,
    weatherCondition: payload.weatherCondition ?? null,
    title: payload.title,
    body: payload.body,
    target: payload.target ?? null,
    createdAt: payload.createdAt,
  };
}

/** 알림 채널에 연결하고 구독한다. 돌려받은 함수를 호출하면 연결을 끊는다. */
export function connectNotificationSocket({
  onNotification,
  onSubscribed,
}: NotificationSocketHandlers): () => void {
  // 서버가 인증 오류로 연결을 거절하면 다음 재연결 때 만료 시각과 관계없이 토큰을 다시 받는다.
  let forceTokenRefresh = false;

  const client = new Client({
    brokerURL: wsUrl(),
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
    reconnectDelay: RECONNECT_DELAY_MS,
    // 서버는 만료된 Access Token으로 CONNECT·SUBSCRIBE하면 거절한다(유효시간 15분).
    // 화면에서 API 요청 없이 오래 머문 뒤 연결이 끊기면 만료된 토큰으로 계속 재시도하게 되므로,
    // 연결 직전에 토큰 만료를 확인하고 필요하면 재발급한다.
    beforeConnect: async (stompClient) => {
      const token = forceTokenRefresh
        ? await refreshAccessTokenOnce()
        : await getValidAccessToken();
      forceTokenRefresh = false;
      stompClient.connectHeaders = { Authorization: `Bearer ${token ?? ''}` };
    },
    onStompError: () => {
      forceTokenRefresh = true;
    },
    onConnect: () => {
      const receiptId = `notifications-${Date.now()}`;
      client.watchForReceipt(receiptId, onSubscribed);
      client.subscribe(
        NOTIFICATION_DESTINATION,
        (message) => {
          try {
            onNotification(
              toIncomingNotification(JSON.parse(message.body) as NotificationSocketPayload),
            );
          } catch {
            // 형식이 맞지 않는 메시지는 무시한다. 알림은 pending 복구와 목록으로 다시 확인할 수 있다.
          }
        },
        { receipt: receiptId },
      );
    },
  });
  client.activate();

  return () => {
    void client.deactivate();
  };
}
