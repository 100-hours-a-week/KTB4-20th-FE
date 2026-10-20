import { getToday, toIsoDate } from '../../utils/date';
import styles from './CalendarMonth.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface CalendarMonthProps {
  year: number;
  monthIndex: number;
  selected: string | null;
  /** 기간을 고를 때 마지막 날 (YYYY-MM-DD). 주면 selected부터 이 날까지 이어서 칠합니다. */
  rangeEnd?: string | null;
  isDisabled: (iso: string) => boolean;
  onSelect: (iso: string) => void;
  /** 요일 머리글을 보여줄지 여부입니다. 여러 달을 이어서 보여줄 때는 맨 위에만 둡니다. */
  showWeekdays?: boolean;
  /** 월 이름을 보여줄지 여부입니다. */
  showMonthName?: boolean;
}

/** 한 달치 날짜를 7열 격자로 보여줍니다. 앞뒤 달의 날짜는 흐리게 표시만 합니다. */
export default function CalendarMonth({
  year,
  monthIndex,
  selected,
  rangeEnd = null,
  isDisabled,
  onSelect,
  showWeekdays = true,
  showMonthName = true,
}: CalendarMonthProps) {
  const today = getToday();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

  const cells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    const iso = toIsoDate(year, monthIndex, day);
    return { iso, day: Number(iso.slice(8)), inMonth: day >= 1 && day <= daysInMonth };
  });

  return (
    <div className={styles.month}>
      {showWeekdays && (
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
      )}
      {showMonthName && <p className={styles.monthName}>{monthLabel}</p>}
      <div className={styles.grid} role="group" aria-label={monthLabel}>
        {cells.map(({ iso, day, inMonth }, index) => {
          if (!inMonth) {
            return (
              <span key={iso} className={`${styles.day} ${styles.outside}`} aria-hidden="true">
                {day}
              </span>
            );
          }
          const disabled = isDisabled(iso);
          const hasRange = selected !== null && rangeEnd !== null && rangeEnd !== selected;
          const isRangeStart = hasRange && iso === selected;
          const isRangeEnd = hasRange && iso === rangeEnd;
          const isSelected = selected === iso || isRangeEnd;
          const isInRange =
            hasRange && selected !== null && rangeEnd !== null && iso > selected && iso < rangeEnd;
          const className = [
            styles.day,
            isSelected ? styles.selected : '',
            isInRange ? styles.inRange : '',
            iso === today && !isSelected && !isInRange ? styles.today : '',
          ]
            .filter(Boolean)
            .join(' ');
          // 출발일~마지막 날을 하나의 띠로 잇습니다. 주가 바뀌는 칸에서는 띠 끝을 둥글게 마감해요.
          const weekday = index % 7;
          const cellClassName = [
            styles.cell,
            isRangeStart ? styles.bandStart : '',
            isRangeEnd ? styles.bandEnd : '',
            isInRange ? styles.bandMiddle : '',
            isInRange && weekday === 0 ? styles.bandRowStart : '',
            isInRange && weekday === 6 ? styles.bandRowEnd : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <span key={iso} className={cellClassName}>
              <button
                type="button"
                className={className}
                disabled={disabled}
                aria-pressed={isSelected || isInRange}
                aria-label={`${year}년 ${monthIndex + 1}월 ${day}일`}
                onClick={() => onSelect(iso)}
              >
                {day}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
