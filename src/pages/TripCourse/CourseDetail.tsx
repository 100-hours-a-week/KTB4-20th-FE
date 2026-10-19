import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapIcon } from 'lucide-react';
import {
  COURSE_ERROR_CODES,
  COURSE_TITLES,
  getScheduleCandidate,
  type ScheduleCandidateDetail,
} from '../../api/courses';
import { getApiErrorCode } from '../../api/errors';
import { getTripDetail } from '../../api/trips';
import { Button } from '@/components/ui/button';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { formatDotDate } from '../../utils/date';
import ScheduleDayView, { DayNavButtons } from '../TripSchedule/ScheduleDayView';
import scheduleStyles from '../TripSchedule/TripSchedule.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; tripName: string; course: ScheduleCandidateDetail }
  | { status: 'notFound' }
  | { status: 'error' };

const DAY_PARAM = 'day';

/** 코스 한 개의 날짜별 동선을 보여주는 화면입니다. 코스를 정하기 전이라 장소를 추가·제거할 수 없어요. */
export default function CourseDetail() {
  const { tripId = '', courseId = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: 'loading' });
      try {
        const [trip, course] = await Promise.all([
          getTripDetail(tripId),
          getScheduleCandidate(tripId, courseId),
        ]);
        if (!cancelled) setState({ status: 'ready', tripName: trip.name, course });
      } catch (error) {
        if (cancelled) return;
        // 확정됐거나 다시 만들어진 후보는 더 이상 조회되지 않아요.
        const notFound = getApiErrorCode(error) === COURSE_ERROR_CODES.candidateNotFound;
        setState({ status: notFound ? 'notFound' : 'error' });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tripId, courseId]);

  const goBack = () => navigate(`/trips/${encodeURIComponent(tripId)}/courses`, { replace: true });

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status !== 'ready') {
    return (
      <main className={scheduleStyles.centerScreen}>
        <StatusMessage
          icon={<MapIcon size={20} strokeWidth={1.6} />}
          title={state.status === 'notFound' ? '코스를 찾을 수 없어요' : '코스를 불러오지 못했어요'}
          description="코스 목록에서 다시 골라 주세요"
        >
          <Button size="lg" className="h-13 w-full" onClick={goBack}>
            코스 목록으로 돌아가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const { course } = state;
  const days = course.days;
  const requestedDay = Number(searchParams.get(DAY_PARAM)) || 1;
  const dayIndex = Math.min(Math.max(requestedDay, 1), Math.max(days.length, 1)) - 1;
  const day = days[dayIndex];

  const moveToDay = (index: number) => {
    setSearchParams({ [DAY_PARAM]: String(index + 1) }, { replace: true });
    window.scrollTo({ top: 0 });
  };

  return (
    <main className={scheduleStyles.container}>
      <PageHeader
        title={`${state.tripName} · ${COURSE_TITLES[course.strategy] ?? course.summary}`}
        subtitle={day ? formatDotDate(day.date) : undefined}
        onBack={goBack}
      />

      {day && <ScheduleDayView key={day.dayId} day={day} />}

      {days.length > 1 && (
        <div className={scheduleStyles.footer}>
          <DayNavButtons dayIndex={dayIndex} dayCount={days.length} onMove={moveToDay} />
        </div>
      )}
    </main>
  );
}
