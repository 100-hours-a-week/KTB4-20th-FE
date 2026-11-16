interface ChatRoomAccessCandidate {
  roomId: string;
  joined: boolean;
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
