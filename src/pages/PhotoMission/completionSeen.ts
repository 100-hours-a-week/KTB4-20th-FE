/*
  완주 화면은 조건마다 한 번만 보여줘요. 백엔드에 기록할 곳이 없어서 이 브라우저에 "봤음" 표시만 남겨요.
  (토큰 같은 비밀값은 넣지 않아요.) 저장소를 못 쓰면 이번 화면에서만 기억해요.
*/

export type CompletionKind = 'day' | 'trip' | 'ended';

const memory = new Set<string>();

function seenKey(tripId: string, kind: CompletionKind, day?: number): string {
  return `planit.photoMission.completionSeen.${tripId}.${kind}${kind === 'day' ? `.${day}` : ''}`;
}

export function hasSeenCompletion(tripId: string, kind: CompletionKind, day?: number): boolean {
  const key = seenKey(tripId, kind, day);
  if (memory.has(key)) return true;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function markCompletionSeen(tripId: string, kind: CompletionKind, day?: number): void {
  const key = seenKey(tripId, kind, day);
  memory.add(key);
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 기억해요.
  }
}
