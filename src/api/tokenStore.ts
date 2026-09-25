/**
 * Access Token은 메모리에만 보관합니다. (localStorage에 저장하지 않음)
 * 새로고침하면 사라지며, 그때는 Refresh Token 쿠키로 다시 발급받습니다.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
