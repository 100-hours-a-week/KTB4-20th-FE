/*
  날짜는 모두 "YYYY-MM-DD" 문자열로 다룹니다.
  백엔드가 서울 시간 기준으로 오늘을 계산하므로 프론트도 서울 시간을 기준으로 합니다.
*/

const seoulDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 서울 기준 오늘 날짜 */
export function getToday(): string {
  return seoulDateFormatter.format(new Date());
}

export function toIsoDate(year: number, monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(year, monthIndex, day));
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(iso: string): { year: number; monthIndex: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, monthIndex: month - 1, day };
}

export function addDays(iso: string, days: number): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  return toIsoDate(year, monthIndex, day + days);
}

/** "2026-01-31" → "2026. 01. 31" */
export function formatDotDate(iso: string): string {
  return iso.replaceAll('-', '. ');
}

/** "2026-01-31" → "1월 31일" */
export function formatMonthDay(iso: string): string {
  const { monthIndex, day } = parseIsoDate(iso);
  return `${monthIndex + 1}월 ${day}일`;
}
