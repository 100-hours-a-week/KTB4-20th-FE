interface ChatRoomAccessCandidate {
  roomId: string;
  joined: boolean;
}

export interface ChatRoomEntry {
  roomId: string;
  token: symbol;
}

/** 같은 방으로 돌아와도 이전 입장 확인을 재사용하지 않도록 화면 진입마다 새 토큰을 만듭니다. */
export function createChatRoomEntry(roomId: string): ChatRoomEntry {
  return { roomId, token: Symbol(roomId) };
}

export function isChatRoomEntryConfirmed(
  confirmedToken: symbol | null,
  currentEntry: ChatRoomEntry,
): boolean {
  return confirmedToken === currentEntry.token;
}

/** 비동기 응답이 effect 정리 이후 화면 이동을 실행하지 못하게 하는 수명 가드입니다. */
export function createChatRoomEffectLifetime(): { isActive: () => boolean; cancel: () => void } {
  let active = true;
  return {
    isActive: () => active,
    cancel: () => {
      active = false;
    },
  };
}

type ChatRoomAccess<T extends ChatRoomAccessCandidate> =
  | { status: 'joined'; room: T }
  | { status: 'membership-required' }
  | { status: 'not-found' };

/** 화면 이동 state보다 서버에서 방금 받은 참여 여부를 기준으로 입장 가능성을 판단합니다. */
export function resolveChatRoomAccess<T extends ChatRoomAccessCandidate>(
  rooms: readonly T[],
  roomId: string,
): ChatRoomAccess<T> {
  const room = rooms.find((candidate) => candidate.roomId === roomId);
  if (!room) return { status: 'not-found' };
  if (!room.joined) return { status: 'membership-required' };
  return { status: 'joined', room };
}
