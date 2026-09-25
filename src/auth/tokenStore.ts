// Access Token은 API_SPEC.md 2.1에 따라 클라이언트 JavaScript 메모리에만 보관한다.
// localStorage/sessionStorage/IndexedDB/Cookie에는 저장하지 않는다.
let accessToken: string | null = null;

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function subscribeAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
