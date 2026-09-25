import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import CalendarMonth from '../../components/Calendar/CalendarMonth';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icon/icons';
import PageHeader from '../../components/PageHeader/PageHeader';
import { getToday, parseIsoDate } from '../../utils/date';
import { isValidDeadline, resolveDeadline } from './deadline';
import { useTripCreate } from './tripCreateContext';
import styles from './TripPicker.module.css';

const VISIBLE_MONTHS = 2;

function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() };
}

/** 여행 출발 날짜를 하루 고르는 화면입니다. 오늘 이전 날짜는 고를 수 없어요. */
export default function TripDate() {
  const navigate = useNavigate();
  const { form, updateForm } = useTripCreate();
  const today = getToday();
  const todayParts = parseIsoDate(today);
  const [selected, setSelected] = useState<string | null>(form.startDate);
  const [view, setView] = useState(() => {
    const base = parseIsoDate(form.startDate ?? today);
    return { year: base.year, monthIndex: base.monthIndex };
  });
  const completingRef = useRef(false);

  const canGoPrev =
    view.year > todayParts.year ||
    (view.year === todayParts.year && view.monthIndex > todayParts.monthIndex);
  const months = Array.from({ length: VISIBLE_MONTHS }, (_, index) =>
    shiftMonth(view.year, view.monthIndex, index),
  );

  const complete = () => {
    if (!selected || completingRef.current) return;
    completingRef.current = true;

    // 날짜가 바뀌어 기존 설문 마감일이 맞지 않게 되면 기본값(여행 전날)으로 되돌립니다.
    const deadline = resolveDeadline(form.deadlineOption, today, selected, form.customDeadline);
    const keepDeadline = deadline !== null && isValidDeadline(deadline, today, selected);
    updateForm({
      startDate: selected,
      ...(keepDeadline ? {} : { deadlineOption: 'dayBefore', customDeadline: null }),
    });
    navigate('/trips/new');
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행 일정 등록" centered onBack={() => navigate('/trips/new')} />

      <div className={styles.body}>
        <section className={styles.calendarCard} aria-label="여행 날짜 선택">
          <div className={styles.calendarHeader}>
            <p className={styles.calendarYear}>{view.year}</p>
            <div className={styles.calendarNav}>
              <button
                type="button"
                className={styles.navButton}
                disabled={!canGoPrev}
                onClick={() => setView(shiftMonth(view.year, view.monthIndex, -1))}
                aria-label="이전 달"
              >
                <ChevronLeftIcon size={18} />
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setView(shiftMonth(view.year, view.monthIndex, 1))}
                aria-label="다음 달"
              >
                <ChevronRightIcon size={18} />
              </button>
            </div>
          </div>
          {months.map(({ year, monthIndex }, index) => (
            <CalendarMonth
              key={`${year}-${monthIndex}`}
              year={year}
              monthIndex={monthIndex}
              selected={selected}
              showWeekdays={index === 0}
              isDisabled={(iso) => iso < today}
              onSelect={setSelected}
            />
          ))}
        </section>
      </div>

      <div className={styles.footer}>
        <Button shape="pill" size="lg" fullWidth disabled={!selected} onClick={complete}>
          선택 완료
        </Button>
      </div>
    </main>
  );
}
