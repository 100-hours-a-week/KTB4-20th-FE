/** 백엔드가 로그인 후 돌아갈 경로로 허용하는 형식 (`/` 또는 초대 링크) */
const RETURN_TO_PATTERN = /^\/(invitations\/[A-Za-z0-9_-]{43})?$/;

export function isValidReturnTo(path: string): boolean {
  return RETURN_TO_PATTERN.test(path);
}
