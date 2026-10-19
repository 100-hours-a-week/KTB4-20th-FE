import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import {
  createTrip,
  getActiveTrips,
  getTripConflict,
  isDateRangeOverlapping,
  leaveTrip,
  MAX_TRIP_DAYS,
  TRIP_LEAVE_NOT_ALLOWED,
  type TripConflict,
  type TripSummary,
} from '../../api/trips';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import { Button } from '@/components/ui/button';
import CalendarMonth from '../../components/Calendar/CalendarMonth';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, MinusIcon, PlusIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import TripConflictDialog from '../../components/TripConflictDialog/TripConflictDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { addDays, formatMonthDay, getToday, parseIsoDate } from '../../utils/date';
import { formatTripDate } from '../../components/TripCard/tripDisplay';
import { DEADLINE_OPTIONS, isValidDeadline, resolveDeadline } from './deadline';
import {
  MAX_CAPACITY,
  MIN_CAPACITY,
  useTripCreate,
  type DeadlineOption,
} from './tripCreateContext';
import styles from './TripCreate.module.css';

const MAX_NAME_LENGTH = 12;

/** 12자를 넘는 부분을 잘라냅니다. 한글·이모지도 한 글자로 셉니다. */
function limitName(value: string): string {
  return Array.from(value).slice(0, MAX_NAME_LENGTH).join('');
}
const NAME_PATTERN = /^[가-힣A-Za-z0-9 ]+$/;
const NAME_ERROR = '형식에 맞지 않는 이름입니다. 다시 입력해주세요';

function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    Array.from(trimmed).length <= MAX_NAME_LENGTH &&
    NAME_PATTERN.test(trimmed)
  );
}

/** 출발일~마지막 날을 "10월 12일 ~ 10월 14일 · 2박 3일"처럼 보여줍니다. */
function formatTripRange(startDate: string, endDate: string): string {
  const { year, monthIndex, day } = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const nights = Math.round(
    (Date.UTC(end.year, end.monthIndex, end.day) - Date.UTC(year, monthIndex, day)) / 86_400_000,
  );
  if (nights === 0) return `${formatTripDate(startDate, true)} · 당일`;
  return `${formatMonthDay(startDate)} ~ ${formatMonthDay(endDate)} · ${nights}박 ${nights + 1}일`;
}

/** 기간 안에서 아직 나가기로 하지 않은, 날짜가 겹치는 첫 여행방을 찾습니다. */
function findConflict(
  trips: TripSummary[],
  range: { startDate: string; endDate: string },
  leaveTrips: TripConflict[],
  today: string,
): TripConflict | null {
  const trip = trips.find(
    (candidate) =>
      isDateRangeOverlapping(candidate, range) &&
      !leaveTrips.some((leave) => leave.tripId === candidate.tripId),
  );
  if (!trip) return null;
  return {
    tripId: trip.tripId,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    // 백엔드와 같은 기준: 출발일 전이면 나갈 수 있어요.
    canLeave: today < trip.startDate,
  };
}

interface FieldErrors {
  region?: string;
  startDate?: string;
  name?: string;
  deadline?: string;
}

export default function TripCreate() {
  const navigate = useNavigate();
  const { form, updateForm, setCreatedTrip } = useTripCreate();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false);
  const dateLabelId = useId();
  const [notice, setNotice] = useState<string | null>(null);
  /** 날짜가 겹치는 기존 여행방. 날짜를 고를 때(from: 'select')나 만들 때 백엔드가 알려줄 때(from: 'submit') 띄워요. */
  const [conflict, setConflict] = useState<{
    trip: TripConflict;
    from: 'select' | 'submit';
  } | null>(null);
  /** 날짜를 고르자마자 겹치는지 보려고 불러둔, 끝나지 않은 내 여행방들. 못 불러오면 만들 때 백엔드가 알려줘요. */
  const [activeTrips, setActiveTrips] = useState<TripSummary[]>([]);
  const submittingRef = useRef(false);
  const nameInputId = useId();
  const nameHelperId = useId();
  const deadlineLabelId = useId();
  const capacityLabelId = useId();

  const today = getToday();
  const deadline = resolveDeadline(form.deadlineOption, today, form.startDate, form.customDeadline);

  useEffect(() => {
    let active = true;
    getActiveTrips().then(
      (trips) => active && setActiveTrips(trips),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, []);

  /** 나가기로 한 여행방 가운데 지금 고른 날짜와 여전히 겹치는 것만 남깁니다. */
  const keepOverlapping = (leaveTrips: TripConflict[], startDate: string, endDate: string) =>
    leaveTrips.filter((trip) => isDateRangeOverlapping(trip, { startDate, endDate }));

  const selectTripDate = (iso: string) => {
    // 출발일을 한 번 더 누르면 고른 날짜를 모두 지웁니다.
    if (iso === form.startDate) {
      updateForm({ startDate: null, endDate: null, leaveTrips: [] });
      return;
    }
    // 출발일만 고른 상태(하루)에서 최대 일수 안의 날을 누르면 마지막 날로, 아니면 새 출발일로 정합니다.
    const isPickingEnd =
      form.startDate !== null && form.startDate === form.endDate && iso > form.startDate;
    const isChoosingEnd =
      isPickingEnd && form.startDate !== null && iso <= addDays(form.startDate, MAX_TRIP_DAYS - 1);
    if (isPickingEnd && !isChoosingEnd) {
      // 말없이 출발일이 바뀌면 왜 기간이 안 잡히는지 알기 어려워서 알려줘요.
      toast(`최대 ${MAX_TRIP_DAYS}일까지예요. 고른 날을 출발일로 바꿨어요`);
    }
    const startDate = isChoosingEnd && form.startDate ? form.startDate : iso;
    const endDate = iso;

    // 날짜가 바뀌어 기존 설문 마감일이 맞지 않게 되면 기본값(여행 전날)으로 되돌립니다.
    const nextDeadline = resolveDeadline(
      form.deadlineOption,
      today,
      startDate,
      form.customDeadline,
    );
    const keepDeadline = nextDeadline !== null && isValidDeadline(nextDeadline, today, startDate);
    const leaveTrips = keepOverlapping(form.leaveTrips, startDate, endDate);
    updateForm({
      startDate,
      endDate,
      leaveTrips,
      ...(keepDeadline ? {} : { deadlineOption: 'dayBefore', customDeadline: null }),
    });
    setErrors((prev) => ({ ...prev, startDate: undefined }));

    const found = findConflict(activeTrips, { startDate, endDate }, leaveTrips, today);
    if (found) setConflict({ trip: found, from: 'select' });
  };

  const isOptionDisabled = (option: DeadlineOption): boolean => {
    // 여행 날짜를 고르기 전에도 마감일은 고를 수 있다. 날짜를 고른 뒤 맞지 않으면 여행 전날로 되돌린다.
    if (option === 'custom' || !form.startDate) return false;
    const candidate = resolveDeadline(option, today, form.startDate, form.customDeadline);
    return candidate === null || !isValidDeadline(candidate, today, form.startDate);
  };

  const selectDeadlineOption = (option: DeadlineOption) => {
    setErrors((previous) => ({ ...previous, deadline: undefined }));
    if (option === 'custom') {
      setIsDeadlineCalendarOpen(true);
      return;
    }
    updateForm({ deadlineOption: option });
  };

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!form.region) nextErrors.region = '여행지를 선택해 주세요.';
    if (!form.startDate || !form.endDate) nextErrors.startDate = '여행 날짜를 선택해 주세요.';
    // 날짜를 고른 뒤 자정이 지나 오늘이 되었을 수도 있어서 다시 확인합니다.
    else if (
      form.startDate <= today ||
      form.endDate < form.startDate ||
      form.endDate > addDays(form.startDate, MAX_TRIP_DAYS - 1)
    ) {
      nextErrors.startDate = '여행 날짜를 다시 선택해 주세요.';
    }
    if (!isValidName(form.name)) nextErrors.name = NAME_ERROR;
    if (form.startDate && (!deadline || !isValidDeadline(deadline, today, form.startDate))) {
      nextErrors.deadline = '설문 마감일을 다시 선택해 주세요.';
    }
    return nextErrors;
  };

  const handleSubmit = async (leaveTrips: TripConflict[] = form.leaveTrips) => {
    if (submittingRef.current) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.region || !form.startDate || !form.endDate) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    const name = form.name.trim();
    const { startDate, endDate } = form;

    try {
      // 날짜가 겹쳐 나가기로 한 기존 여행방에서 먼저 나갑니다.
      // 나간 방은 바로 목록에서 지워서, 만들기가 실패해 다시 눌러도 또 나가지 않게 해요.
      for (const trip of keepOverlapping(leaveTrips, startDate, endDate)) {
        try {
          await leaveTrip(trip.tripId);
        } catch (error) {
          updateForm({ leaveTrips: leaveTrips.filter((leave) => leave.tripId !== trip.tripId) });
          setNotice(
            getApiErrorCode(error) === TRIP_LEAVE_NOT_ALLOWED
              ? `'${trip.name}'은 이미 시작해서 나갈 수 없어요`
              : '기존 여행방에서 나가지 못했어요. 다시 시도해 주세요',
          );
          return;
        }
        leaveTrips = leaveTrips.filter((leave) => leave.tripId !== trip.tripId);
        updateForm({ leaveTrips });
        setActiveTrips((trips) => trips.filter((active) => active.tripId !== trip.tripId));
      }

      const result = await createTrip({
        name,
        regionId: form.region.regionId,
        startDate,
        endDate,
        capacity: form.capacity,
        surveyDeadlineDate: deadline ?? undefined,
      });
      setCreatedTrip({
        ...result,
        name,
        regionLabel: form.region.label,
        startDate,
        endDate,
        capacity: form.capacity,
      });
      navigate('/trips/new/done', { replace: true });
    } catch (error) {
      const serverConflict = getTripConflict(error);
      if (serverConflict) {
        // 날짜를 고를 때 몰랐던 겹치는 여행방이 있으면 같은 팝업으로 물어봐요.
        setConflict({ trip: serverConflict, from: 'submit' });
      } else {
        setNotice('여행방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const continueWithConflict = () => {
    if (!conflict || !form.startDate || !form.endDate) return;
    const leaveTrips = [...form.leaveTrips, conflict.trip];
    updateForm({ leaveTrips });
    setConflict(null);

    if (conflict.from === 'submit') {
      void handleSubmit(leaveTrips);
      return;
    }
    // 고른 기간에 겹치는 여행방이 더 있으면 이어서 물어봐요.
    const next = findConflict(
      activeTrips,
      { startDate: form.startDate, endDate: form.endDate },
      leaveTrips,
      today,
    );
    if (next) setConflict({ trip: next, from: 'select' });
  };

  /**
   * 기존 여행방을 유지합니다. 날짜는 막지 않고, 겹치는 선택만 되돌려요.
   * 출발일이 겹치지 않으면 출발일만 남기고(다시 마지막 날을 고르게), 겹치면 선택을 지워요.
   */
  const keepConflictTrip = () => {
    if (!conflict) return;
    const kept = conflict.trip;
    setConflict(null);
    const startDate = form.startDate;
    const startStillOpen =
      startDate !== null && !isDateRangeOverlapping(kept, { startDate, endDate: startDate });
    updateForm({
      ...(startStillOpen && startDate
        ? {
            endDate: startDate,
            leaveTrips: keepOverlapping(form.leaveTrips, startDate, startDate),
          }
        : { startDate: null, endDate: null, leaveTrips: [] }),
    });
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행방 만들기" onBack={() => navigate('/')} />

      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.label}>여행지</span>
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => navigate('/trips/new/place')}
            aria-invalid={Boolean(errors.region)}
          >
            <MapPinIcon size={18} />
            <span className={form.region ? styles.value : styles.placeholder}>
              {form.region?.label ?? '어디로 떠나시나요?'}
            </span>
          </button>
          {errors.region && <p className={styles.error}>{errors.region}</p>}
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label} id={dateLabelId}>
              여행 날짜
            </span>
            <span className={form.startDate ? styles.dateValue : styles.datePlaceholder}>
              {form.startDate && form.endDate
                ? formatTripRange(form.startDate, form.endDate)
                : '출발할 날을 골라주세요'}
            </span>
          </div>
          {/* 달력을 처음부터 펼쳐 두고 바로 고르게 한다 */}
          <StartDateCalendar
            labelledBy={dateLabelId}
            invalid={Boolean(errors.startDate)}
            today={today}
            selected={form.startDate}
            rangeEnd={form.endDate}
            onSelect={selectTripDate}
          />
          {errors.startDate ? (
            <p className={styles.error}>{errors.startDate}</p>
          ) : (
            <p className={styles.helper}>
              {form.startDate && form.startDate === form.endDate
                ? `돌아오는 날을 골라주세요. 당일치기라면 이대로 두면 돼요 (최대 ${MAX_TRIP_DAYS}일)`
                : `출발일과 마지막 날을 차례로 눌러주세요 (최대 ${MAX_TRIP_DAYS}일)`}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label} id={capacityLabelId}>
            초대 인원
          </span>
          <div className={styles.stepper} role="group" aria-labelledby={capacityLabelId}>
            <span className={styles.value} aria-live="polite">
              {form.capacity} 명
            </span>
            <div className={styles.stepperButtons}>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => updateForm({ capacity: form.capacity - 1 })}
                disabled={form.capacity <= MIN_CAPACITY}
                aria-label="인원 줄이기"
              >
                <MinusIcon size={16} />
              </button>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => updateForm({ capacity: form.capacity + 1 })}
                disabled={form.capacity >= MAX_CAPACITY}
                aria-label="인원 늘리기"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>
          <p className={styles.helper}>
            본인 포함 인원이에요 (최소 {MIN_CAPACITY}명 최대 {MAX_CAPACITY}명)
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameInputId}>
            방 이름
            <span className={styles.required} aria-hidden="true">
              *
            </span>
            <span className={styles.srOnly}>(필수)</span>
          </label>
          <input
            id={nameInputId}
            className={styles.input}
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="방 이름을 입력하세요"
            autoComplete="off"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={nameHelperId}
            // 한글을 조합하는 중에는 브라우저 글자 수 제한(maxLength)이 13번째 글자를 들여보내는 경우가 있어서,
            // 조합 중이어도 12자를 넘으면 입력칸의 글자를 바로 12자로 되돌려 13번째 글자를 막습니다.
            onChange={(event) => {
              const limited = limitName(event.target.value);
              if (limited !== event.target.value) {
                event.target.value = limited;
              }
              updateForm({ name: limited });
            }}
            onCompositionEnd={(event) => {
              const limited = limitName(event.currentTarget.value);
              if (limited !== event.currentTarget.value) {
                event.currentTarget.value = limited;
              }
              updateForm({ name: limited });
            }}
            onBlur={() =>
              setErrors((previous) => ({
                ...previous,
                name: form.name && !isValidName(form.name) ? NAME_ERROR : undefined,
              }))
            }
          />
          <div className={styles.helperRow}>
            <p id={nameHelperId} className={errors.name ? styles.error : styles.helper}>
              {errors.name ?? `한글, 영어, 숫자로 최대 ${MAX_NAME_LENGTH}글자까지 입력할 수 있어요`}
            </p>
            <span className={styles.counter} aria-hidden="true">
              {Array.from(form.name).length}/{MAX_NAME_LENGTH}
            </span>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label} id={deadlineLabelId}>
            취향 설문 마감일
          </span>
          <div className={styles.chips} role="radiogroup" aria-labelledby={deadlineLabelId}>
            {DEADLINE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.deadlineOption === value}
                className={`${styles.chip} ${form.deadlineOption === value ? styles.chipSelected : ''}`}
                disabled={isOptionDisabled(value)}
                onClick={() => selectDeadlineOption(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.deadline ? (
            <p className={styles.error}>{errors.deadline}</p>
          ) : (
            <p className={styles.helper}>
              {deadline
                ? `${formatMonthDay(deadline)} 밤 12시에 설문이 마감돼요`
                : '여행 날짜를 고르면 여행 전날로 정해져요'}
            </p>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? '만드는 중...' : '여행방 만들기'}
        </Button>
      </div>

      <DeadlineCalendarDialog
        open={isDeadlineCalendarOpen}
        today={today}
        startDate={form.startDate}
        selected={form.deadlineOption === 'custom' ? form.customDeadline : null}
        onSelect={(iso) => {
          updateForm({ deadlineOption: 'custom', customDeadline: iso });
          setIsDeadlineCalendarOpen(false);
        }}
        onClose={() => setIsDeadlineCalendarOpen(false)}
      />

      <TripConflictDialog
        conflict={conflict?.trip ?? null}
        mode="create"
        onContinue={continueWithConflict}
        onCancel={keepConflictTrip}
      />

      <AlertDialog
        open={notice !== null}
        title="여행방을 만들지 못했어요"
        description={notice ?? undefined}
        primaryAction={{ label: '확인', onClick: () => setNotice(null) }}
        onClose={() => setNotice(null)}
      />
    </main>
  );
}

/**
 * 여행방 만들기 화면에 펼쳐 둔 여행 날짜 달력입니다. 출발일과 마지막 날을 차례로 눌러 기간을 골라요.
 * 여행은 내일부터 시작할 수 있어서 오늘과 그 이전 날짜는 고를 수 없어요.
 */
function StartDateCalendar({
  labelledBy,
  invalid,
  today,
  selected,
  rangeEnd,
  onSelect,
}: {
  labelledBy: string;
  invalid: boolean;
  today: string;
  selected: string | null;
  rangeEnd: string | null;
  onSelect: (iso: string) => void;
}) {
  const initial = parseIsoDate(selected ?? today);
  const [view, setView] = useState({ year: initial.year, monthIndex: initial.monthIndex });
  const todayParts = parseIsoDate(today);
  const canGoPrev =
    view.year > todayParts.year ||
    (view.year === todayParts.year && view.monthIndex > todayParts.monthIndex);

  const moveMonth = (delta: number) => {
    setView(({ year, monthIndex }) => {
      const next = new Date(Date.UTC(year, monthIndex + delta, 1));
      return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
    });
  };

  return (
    <div
      className={`${styles.calendarCard} ${invalid ? styles.calendarCardInvalid : ''}`}
      role="group"
      aria-labelledby={labelledBy}
    >
      <div className={styles.calendarHeader}>
        <p className={styles.calendarTitle}>
          {view.year}년 {view.monthIndex + 1}월
        </p>
        <div className={styles.calendarNav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveMonth(-1)}
            disabled={!canGoPrev}
            aria-label="이전 달"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      </div>
      <CalendarMonth
        year={view.year}
        monthIndex={view.monthIndex}
        selected={selected}
        rangeEnd={rangeEnd}
        showMonthName={false}
        isDisabled={(iso) => iso <= today}
        onSelect={onSelect}
      />
    </div>
  );
}

interface DeadlineCalendarDialogProps {
  open: boolean;
  today: string;
  /** 아직 여행 날짜를 고르지 않았으면 null. 그때는 오늘 이후 아무 날이나 고를 수 있다. */
  startDate: string | null;
  selected: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
}

/**
 * '직접 선택'을 눌렀을 때 마감일을 고르는 달력 팝업입니다. 오늘부터 여행 전날까지 고를 수 있어요.
 * 여행 날짜를 아직 고르지 않았으면 오늘 이후 아무 날이나 고를 수 있고, 백엔드가 만들 때 다시 확인합니다.
 */
function DeadlineCalendarDialog({
  open,
  today,
  startDate,
  selected,
  onSelect,
  onClose,
}: DeadlineCalendarDialogProps) {
  const initial = parseIsoDate(selected ?? today);
  const [view, setView] = useState({ year: initial.year, monthIndex: initial.monthIndex });
  const todayParts = parseIsoDate(today);
  const startParts = startDate ? parseIsoDate(startDate) : null;
  const canGoPrev =
    view.year > todayParts.year ||
    (view.year === todayParts.year && view.monthIndex > todayParts.monthIndex);
  const canGoNext =
    startParts === null ||
    view.year < startParts.year ||
    (view.year === startParts.year && view.monthIndex < startParts.monthIndex);

  const moveMonth = (delta: number) => {
    setView(({ year, monthIndex }) => {
      const next = new Date(Date.UTC(year, monthIndex + delta, 1));
      return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-[var(--radius-lg)] p-5">
        <div className={styles.calendarHeader}>
          <DialogTitle className={styles.calendarTitle}>
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
              new Date(Date.UTC(view.year, view.monthIndex, 1)),
            )}
          </DialogTitle>
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => moveMonth(-1)}
              disabled={!canGoPrev}
              aria-label="이전 달"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => moveMonth(1)}
              disabled={!canGoNext}
              aria-label="다음 달"
            >
              <ChevronRightIcon size={18} />
            </button>
          </div>
        </div>
        <CalendarMonth
          year={view.year}
          monthIndex={view.monthIndex}
          selected={selected}
          showMonthName={false}
          isDisabled={(iso) => (startDate ? !isValidDeadline(iso, today, startDate) : iso < today)}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
