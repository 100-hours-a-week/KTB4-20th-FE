const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 알림 시각을 "N초 전" 형식으로 바꾼다. (BR-NOTI-05)
 * 1분 미만은 초, 30분 미만은 분, 30분~1시간은 10분 단위, 24시간 미만은 시간, 그 이상은 일 단위.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed < MINUTE) return `${Math.floor(elapsed / SECOND)}초 전`;
  if (elapsed < 30 * MINUTE) return `${Math.floor(elapsed / MINUTE)}분 전`;
  if (elapsed < HOUR) return `${Math.floor(elapsed / (10 * MINUTE)) * 10}분 전`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`;
  return `${Math.floor(elapsed / DAY)}일 전`;
}
