/*
  로그인하지 않은 상태로 초대 링크에 들어오면, 로그인 후 돌아갈 초대 경로를 잠시 보관합니다.
  로그인에 실패하면 백엔드가 `/login?error=`로만 돌려보내서 돌아갈 경로가 사라지기 때문입니다.
  브라우저 탭을 닫으면 사라지는 sessionStorage를 쓰고, 로그인에 성공하거나 로그아웃하면 지웁니다.
  (인증 토큰이 아니라 초대 경로만 보관합니다.)
*/

const STORAGE_KEY = 'planit:pendingInvitation';

export function savePendingInvitation(path: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // 저장할 수 없는 환경이면 URL의 returnTo만으로 동작합니다.
  }
}

export function getPendingInvitation(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvitation(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지울 수 없어도 탭을 닫으면 사라집니다.
  }
}
