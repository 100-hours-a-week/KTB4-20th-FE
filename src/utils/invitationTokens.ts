/*
  여행방을 만들 때 받은 초대 토큰을 이 브라우저 탭 동안만 보관합니다.
  백엔드는 초대 토큰을 여행방 생성 응답으로 한 번만 알려주고 다시 조회할 수 없어서,
  같은 탭에서 여행방 상세로 이동했을 때 초대 링크를 복사할 수 있게 합니다.
  (로그인 토큰이 아니라 초대 링크용 값이며, 탭을 닫으면 사라집니다.)
*/

const STORAGE_KEY = 'planit:invitationTokens';

function readAll(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveInvitationToken(tripId: string, invitationToken: string): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readAll(), [tripId]: invitationToken }),
    );
  } catch {
    // 저장할 수 없는 환경이면 생성 완료 화면에서만 복사할 수 있습니다.
  }
}

export function getInvitationToken(tripId: string): string | null {
  return readAll()[tripId] ?? null;
}
