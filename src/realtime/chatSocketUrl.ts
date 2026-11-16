/** 상대·절대 API 기준 주소에서 동일한 호스트의 STOMP WebSocket 주소를 만듭니다. */
export function buildChatWebSocketUrl(apiBaseUrl: string, pageOrigin: string): string {
  const origin = new URL(apiBaseUrl, pageOrigin).origin;
  return `${origin.replace(/^http/, 'ws')}/ws`;
}
