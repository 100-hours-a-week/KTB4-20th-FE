import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import { createTrip, TRIP_DATE_CONFLICT } from '../../api/trips';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import { Button } from '@/components/ui/button';
import CalendarMonth from '../../components/Calendar/CalendarMonth';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader/PageHeader';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatDotDate, formatMonthDay, getToday, parseIsoDate } from '../../utils/date';
import { saveInvitationToken } from '../../utils/invitationTokens';
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
const NAME_PATTERN = /^[가-힣A-Za-z ]+$/;
const NAME_ERROR = '형식에 맞지 않는 이름입니다. 다시 입력해주세요';

function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    Array.from(trimmed).length <= MAX_NAME_LENGTH &&
    NAME_PATTERN.test(trimmed)
  );
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
  const [notice, setNotice] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const nameInputId = useId();
  const nameHelperId = useId();
  const deadlineLabelId = useId();
  const capacityLabelId = useId();

  const today = getToday();
  const isTripToday = form.startDate === today;
  const deadline = resolveDeadline(form.deadlineOption, today, form.startDate, form.customDeadline);

  const isOptionDisabled = (option: DeadlineOption): boolean => {
    if (option === 'custom') return form.startDate === null;
    if (!form.startDate) return false;
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
    if (!form.startDate) nextErrors.startDate = '여행 날짜를 선택해 주세요.';
    if (!isValidName(form.name)) nextErrors.name = NAME_ERROR;
    if (
      form.startDate &&
      !isTripToday &&
      (!deadline || !isValidDeadline(deadline, today, form.startDate))
    ) {
      nextErrors.deadline = '설문 마감일을 다시 선택해 주세요.';
    }
    return nextErrors;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.region || !form.startDate) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    const name = form.name.trim();

    try {
      const result = await createTrip({
        name,
        regionId: form.region.regionId,
        startDate: form.startDate,
        capacity: form.capacity,
        surveyDeadlineDate: isTripToday || !deadline ? undefined : deadline,
      });
      saveInvitationToken(result.tripId, result.invitationToken);
      setCreatedTrip({
        ...result,
        name,
        regionLabel: form.region.label,
        startDate: form.startDate,
        capacity: form.capacity,
      });
      navigate('/trips/new/done', { replace: true });
    } catch (error) {
      setNotice(
        getApiErrorCode(error) === TRIP_DATE_CONFLICT
          ? (getApiErrorMessage(error) ?? '해당 날짜에 참여 중인 여행이 있습니다.')
          : '여행방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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
          <span className={styles.label}>여행 날짜</span>
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => navigate('/trips/new/date')}
            aria-invalid={Boolean(errors.startDate)}
          >
            <CalendarIcon size={18} />
            <span className={form.startDate ? styles.value : styles.placeholder}>
              {form.startDate ? formatDotDate(form.startDate) : '날짜를 선택하세요'}
            </span>
          </button>
          {errors.startDate && <p className={styles.error}>{errors.startDate}</p>}
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
              {errors.name ?? `한글, 영어로 최대 ${MAX_NAME_LENGTH}글자까지 입력할 수 있어요`}
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
          {isTripToday ? (
            <p className={styles.fixedDeadline}>여행 당일이라 오늘 낮 12시에 설문이 마감돼요</p>
          ) : (
            <>
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
                  {deadline && form.startDate
                    ? `${formatMonthDay(deadline)} 밤 12시에 설문이 마감돼요`
                    : '여행 날짜를 고르면 마감일이 정해져요'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '만드는 중...' : '여행방 만들기'}
        </Button>
      </div>

      {form.startDate && (
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
      )}

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

interface DeadlineCalendarDialogProps {
  open: boolean;
  today: string;
  startDate: string;
  selected: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
}

/** '직접 선택'을 눌렀을 때 마감일을 고르는 달력 팝업입니다. 오늘부터 여행 전날까지 고를 수 있어요. */
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
  const startParts = parseIsoDate(startDate);
  const canGoPrev =
    view.year > todayParts.year ||
    (view.year === todayParts.year && view.monthIndex > todayParts.monthIndex);
  const canGoNext =
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
          isDisabled={(iso) => !isValidDeadline(iso, today, startDate)}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
