import { addDays } from '../../utils/date';
import type { DeadlineOption } from './tripCreateContext';

export const DEADLINE_OPTIONS: { value: DeadlineOption; label: string }[] = [
  { value: 'oneDay', label: '1일 후' },
  { value: 'threeDays', label: '3일 후' },
  { value: 'dayBefore', label: '여행 전날' },
  { value: 'custom', label: '직접 선택' },
];

/** 선택지에 해당하는 마감 날짜를 계산합니다. 계산할 수 없으면 null입니다. */
export function resolveDeadline(
  option: DeadlineOption,
  today: string,
  startDate: string | null,
  customDeadline: string | null,
): string | null {
  switch (option) {
    case 'oneDay':
      return addDays(today, 1);
    case 'threeDays':
      return addDays(today, 3);
    case 'dayBefore':
      return startDate ? addDays(startDate, -1) : null;
    case 'custom':
      return customDeadline;
  }
}

/** 마감일은 오늘부터 여행 전날까지만 가능합니다. (백엔드 규칙과 같음) */
export function isValidDeadline(deadline: string, today: string, startDate: string): boolean {
  return deadline >= today && deadline < startDate;
}
