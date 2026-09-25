import type { TripStatus } from '../../api/trips';

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  SURVEY_IN_PROGRESS: '설문 중',
  SCHEDULE_COMPLETED: '생성 완료',
  TRIP_IN_PROGRESS: '여행 중',
  TRIP_COMPLETED: '여행 완료',
};

const MAX_TRIP_NAME_LENGTH = 12;

/** 여행방 이름이 12글자를 넘으면 뒤를 "..."으로 줄입니다. */
export function truncateTripName(name: string): string {
  const characters = Array.from(name);
  if (characters.length <= MAX_TRIP_NAME_LENGTH) return name;
  return `${characters.slice(0, MAX_TRIP_NAME_LENGTH).join('')}...`;
}

/** "2026-08-26", 4 → "2026.08.26 · 4명" */
export function formatTripMeta(startDate: string, memberCount: number): string {
  return `${startDate.replaceAll('-', '.')} · ${memberCount}명`;
}
