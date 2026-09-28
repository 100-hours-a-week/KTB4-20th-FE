/*
  axios 인터셉터(client.ts)처럼 React 컴포넌트가 아닌 곳에서도, 세션이 끝났다는 사실을
  AuthProvider에게 알릴 수 있어야 한다. 이 작은 이벤트 버스가 그 다리 역할을 한다.
*/

type Listener = () => void;

const listeners = new Set<Listener>();

/** AuthProvider가 구독해서, 세션이 끝나면 로그인 상태를 즉시 해제하고 로그인 화면으로 보낸다. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
