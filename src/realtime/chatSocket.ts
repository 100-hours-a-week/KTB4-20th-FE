import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs';
import type { ChatMessageItem } from '../api/chat';

// CHAT_API_SPEC.md 10장 — Native WebSocket 기반 Spring WebSocket + STOMP, 재연결은 제공하지 않는다.
const HEARTBEAT_MS = 10_000;
const USER_EVENTS_DESTINATION = '/user/queue/chat-events';
const ROOM_DESTINATION = (roomId: string) => `/topic/regional-chat-rooms/${roomId}/messages`;
const SEND_DESTINATION = (roomId: string) => `/app/regional-chat-rooms/${roomId}/messages`;

export interface ChatMessageCreatedEvent {
  eventType: 'CHAT_MESSAGE_CREATED';
  roomId: string;
  occurredAt: string;
  data: ChatMessageItem;
}

export interface ChatMessageResultEvent {
  eventType: 'CHAT_MESSAGE_RESULT';
  status: 'ACCEPTED' | 'BLOCKED' | 'REJECTED';
  code: string;
  message: string;
  clientMessageId: string;
  roomId: string;
  occurredAt: string;
  data: { messageId: string; createdAt: string } | null;
}

export interface ChatPolicyConsentRequiredEvent {
  eventType: 'CHAT_POLICY_CONSENT_REQUIRED';
  status: 'REQUIRED';
  code: string;
  message: string;
  occurredAt: string;
  data: { policyVersionId: string };
}

export interface ChatRoomMembershipEndedEvent {
  eventType: 'CHAT_ROOM_MEMBERSHIP_ENDED';
  status: 'ENDED';
  code: string;
  message: string;
  roomId: string;
  occurredAt: string;
  data: null;
}

export interface ChatSanctionUpdatedEvent {
  eventType: 'CHAT_SANCTION_UPDATED';
  status: 'ACTIVE';
  code: string;
  message: string;
  occurredAt: string;
  data: { sanctionLevel: number; startsAt: string; endsAt: string; remainingSeconds: number };
}

export type ChatUserEvent =
  | ChatMessageResultEvent
  | ChatPolicyConsentRequiredEvent
  | ChatRoomMembershipEndedEvent
  | ChatSanctionUpdatedEvent;

interface SendTextPayload {
  clientMessageId: string;
  messageType: 'TEXT';
  text: string;
}

let client: Client | null = null;
let roomSubscription: StompSubscription | null = null;
let userEventHandler: ((event: ChatUserEvent) => void) | null = null;
const pendingReceipts = new Map<string, { resolve: () => void; reject: (error: Error) => void }>();

function wsUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  // 배포 환경은 VITE_API_BASE_URL을 "/api"처럼 상대 경로로 준다(프론트와 백엔드가 같은 origin 뒤에 있음).
  // new URL()은 상대 경로만 주면 예외를 던지므로 현재 페이지 origin을 기준으로 풀어준다.
  const origin = new URL(apiBaseUrl, window.location.origin).origin;
  return `${origin.replace(/^http/, 'ws')}/ws`;
}

function handleStompError(frame: IFrame): void {
  const receiptId = frame.headers['receipt-id'];
  if (receiptId && pendingReceipts.has(receiptId)) {
    const pending = pendingReceipts.get(receiptId)!;
    pendingReceipts.delete(receiptId);
    let message = frame.headers.message ?? '채팅방 구독에 실패했어요.';
    try {
      const body = JSON.parse(frame.body) as { message?: string };
      message = body.message ?? message;
    } catch {
      // JSON 파싱 실패 시 헤더 메시지를 그대로 사용한다.
    }
    pending.reject(new Error(message));
  }
}

/** STOMP CONNECT — 채팅 화면에 진입할 때 한 번 연결한다. */
export function connectChatSocket(accessToken: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // React StrictMode의 effect 이중 실행(mount→cleanup→mount)으로 이전 인스턴스가
    // deactivate된 뒤 비동기 콜백이 도착할 수 있어, 모듈 공용 client가 아니라
    // 이 호출이 만든 인스턴스를 직접 캡처해 콜백에서 참조한다.
    const stompClient = new Client({
      brokerURL: wsUrl(),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      heartbeatIncoming: HEARTBEAT_MS,
      heartbeatOutgoing: HEARTBEAT_MS,
      reconnectDelay: 0, // 스펙상 자동 재연결을 제공하지 않는다.
      onConnect: () => {
        if (client !== stompClient) return; // 이미 교체·해제된 인스턴스의 지연 콜백은 무시한다.
        stompClient.subscribe(USER_EVENTS_DESTINATION, (message) => {
          if (userEventHandler) {
            userEventHandler(JSON.parse(message.body) as ChatUserEvent);
          }
        });
        resolve();
      },
      onStompError: (frame) => {
        handleStompError(frame);
        if (client === stompClient) {
          reject(new Error(frame.headers.message ?? '채팅 서버 연결에 실패했어요.'));
        }
      },
      onWebSocketError: () => {
        if (client === stompClient) {
          reject(new Error('채팅 서버에 연결하지 못했어요.'));
        }
      },
    });
    client = stompClient;
    stompClient.activate();
  });
}

/** 채팅 기능을 완전히 벗어날 때 연결을 종료한다. */
export async function disconnectChatSocket(): Promise<void> {
  const stompClient = client;
  roomSubscription = null;
  userEventHandler = null;
  pendingReceipts.clear();
  if (stompClient) {
    await stompClient.deactivate();
    // 대기하는 동안 새 connectChatSocket 호출이 client를 교체했다면 그 인스턴스는 건드리지 않는다.
    if (client === stompClient) {
      client = null;
    }
  }
}

export function setUserEventHandler(handler: (event: ChatUserEvent) => void): void {
  userEventHandler = handler;
}

/** 현재 보고 있는 방 하나만 구독한다. 성공은 STOMP RECEIPT, 실패는 ERROR 프레임으로 확인한다. */
export function subscribeRoom(
  roomId: string,
  onMessage: (event: ChatMessageCreatedEvent) => void,
): Promise<void> {
  if (!client?.connected) {
    return Promise.reject(new Error('채팅 서버에 연결되어 있지 않아요.'));
  }
  const receiptId = `subscribe-${roomId}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    pendingReceipts.set(receiptId, {
      resolve: () => resolve(),
      reject,
    });
    client!.watchForReceipt(receiptId, () => {
      pendingReceipts.delete(receiptId);
      resolve();
    });
    roomSubscription = client!.subscribe(
      ROOM_DESTINATION(roomId),
      (message) => {
        onMessage(JSON.parse(message.body) as ChatMessageCreatedEvent);
      },
      { receipt: receiptId },
    );
  });
}

/** 다른 방으로 이동하거나 방을 벗어날 때 기존 방을 UNSUBSCRIBE한다. */
export function unsubscribeRoom(): void {
  roomSubscription?.unsubscribe();
  roomSubscription = null;
}

export function sendTextMessage(roomId: string, clientMessageId: string, text: string): void {
  if (!client?.connected) {
    throw new Error('채팅 서버에 연결되어 있지 않아요.');
  }
  const payload: SendTextPayload = { clientMessageId, messageType: 'TEXT', text };
  client.publish({
    destination: SEND_DESTINATION(roomId),
    body: JSON.stringify(payload),
  });
}

export function isChatSocketConnected(): boolean {
  return client?.connected ?? false;
}
