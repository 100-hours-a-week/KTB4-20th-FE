import type { TripStatus } from '../../api/trips';
import { getToday, parseIsoDate } from '../../utils/date';

function toUtcTime(iso: string): number {
  const { year, monthIndex, day } = parseIsoDate(iso);
  return Date.UTC(year, monthIndex, day);
}

/** 출발일까지 남은 날 수. 이미 출발했거나 끝난 여행은 null */
export function getDaysUntil(startDate: string, status: TripStatus): number | null {
  if (status === 'TRIP_IN_PROGRESS' || status === 'TRIP_COMPLETED') return null;
  const days = Math.round((toUtcTime(startDate) - toUtcTime(getToday())) / 86_400_000);
  return days < 0 ? null : days;
}

/** "2026-09-29" → "09.29" */
export function formatShortDate(iso: string): string {
  return iso.slice(5).replace('-', '.');
}

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** "2026-10-12" → "10월 12일", 요일을 붙이면 "10월 12일 월요일" */
export function formatTripDate(iso: string, withWeekday = false): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  const label = `${monthIndex + 1}월 ${day}일`;
  if (!withWeekday) return label;
  return `${label} ${WEEKDAYS[new Date(Date.UTC(year, monthIndex, day)).getUTCDay()]}`;
}
