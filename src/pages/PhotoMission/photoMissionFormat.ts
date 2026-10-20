import { SURVEY_CATEGORY_LABELS } from '../../constants/surveyCategories';
import { parseIsoDate } from '../../utils/date';

/** AI가 미션을 만들 때 쓰는 취향 코드 이름. 설문 코드와 조금 달라서 둘 다 받아요. */
const MISSION_CATEGORY_LABELS: Record<string, string> = {
  ...SURVEY_CATEGORY_LABELS,
  ACTIVITY: '액티비티',
  CONVENIENCE_SHOPPING: '편의·쇼핑',
};

export function formatMissionCategory(code: string | null | undefined): string | null {
  if (!code) return null;
  return MISSION_CATEGORY_LABELS[code] ?? null;
}

/** "대릉원 · 그룹 취향 '역사·문화' 반영"처럼 장소와 취향 중 있는 것만 잇습니다. */
export function formatMissionContext(
  placeName: string | null | undefined,
  category: string | null | undefined,
): string | null {
  const label = formatMissionCategory(category);
  const parts = [placeName, label && `그룹 취향 '${label}' 반영`].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export const SCOPE_LABELS = { PERSONAL: '개인', GROUP: '그룹' } as const;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** "2026-09-01" → "9월 1일(화)" */
export function formatMonthDayWeekday(iso: string): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, monthIndex, day)).getUTCDay()];
  return `${monthIndex + 1}월 ${day}일(${weekday})`;
}

/** "2026-08-31", "2026-09-02" → "2026.08.31 ~ 09.02" (해가 다르면 끝에도 연도를 붙여요) */
export function formatTripRange(startDate: string, endDate: string): string {
  const start = startDate.replaceAll('-', '.');
  if (startDate === endDate) return start;
  const end = startDate.slice(0, 4) === endDate.slice(0, 4) ? endDate.slice(5) : endDate;
  return `${start} ~ ${end.replaceAll('-', '.')}`;
}

/** 이름이 8글자를 넘으면 줄여요. (시안 규칙) */
export function shortenName(name: string): string {
  const chars = Array.from(name);
  return chars.length > 8 ? `${chars.slice(0, 8).join('')}…` : name;
}

/** "2026-09-01T14:40:00" → "9월 1일 오후 2:40" */
export function formatMissionTime(isoDateTime: string): string {
  const [date, time = '00:00'] = isoDateTime.split('T');
  const { monthIndex, day } = parseIsoDate(date);
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${monthIndex + 1}월 ${day}일 ${period} ${hour12}:${minute}`;
}
