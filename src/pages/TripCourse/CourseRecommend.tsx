import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  confirmSchedule,
  COURSE_ERROR_CODES,
  COURSE_TITLES,
  getScheduleCandidates,
  type ScheduleCandidateSummary,
} from '../../api/courses';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import { getSchedule, SCHEDULE_ERROR_CODES } from '../../api/schedule';
import { getTripDetail, TRIP_DETAIL_ERROR_CODES, type TripDetail } from '../../api/trips';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { formatDistance } from '../../utils/distance';
import styles from './TripCourse.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; trip: TripDetail; candidates: ScheduleCandidateSummary[] }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'error' };

/** 확정 일정이 있으면 true. 후보가 없을 때 이미 확정한 건지 구분하려고 써요. */
async function hasConfirmedSchedule(tripId: string): Promise<boolean> {
  try {
    await getSchedule(tripId);
    return true;
  } catch (error) {
    if (getApiErrorCode(error) === SCHEDULE_ERROR_CODES.notFound) return false;
    throw error;
  }
}

/** AI가 만든 3가지 코스를 비교하고 방장이 하나를 고르는 화면입니다. 그룹원은 보기만 할 수 있어요. */
export default function CourseRecommend() {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingCourse, setPendingCourse] = useState<ScheduleCandidateSummary | null>(null);
  const [confirming, setConfirming] = useState(false);

  const tripPath = `/trips/${encodeURIComponent(tripId)}`;

  const load = useCallback(async () => {
    try {
      const [trip, candidates] = await Promise.all([
        getTripDetail(tripId),
        getScheduleCandidates(tripId),
      ]);
      setState({ status: 'ready', trip, candidates });
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === COURSE_ERROR_CODES.candidatesNotFound) {
        // 확정하고 나면 후보 목록은 더 이상 오지 않아요. 확정 일정이 있으면 그 화면으로 보내요.
        try {
          if (await hasConfirmedSchedule(tripId)) {
            navigate(`${tripPath}/schedule`, { replace: true });
          } else {
            setState({ status: 'empty' });
          }
        } catch {
          setState({ status: 'error' });
        }
        return;
      }
      const isInvalid =
        code === TRIP_DETAIL_ERROR_CODES.memberRequired || code === TRIP_DETAIL_ERROR_CODES.notFound;
      setState({ status: isInvalid ? 'invalid' : 'error' });
    }
  }, [navigate, tripId, tripPath]);

  useEffect(() => {
    // 처음 진입할 때 한 번 불러와요. (상태는 load 안에서 비동기로 바뀌어요)
    void load();
  }, [load]);

  const goBack = () => navigate(tripPath, { replace: true });

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status !== 'ready') {
    const copy = {
      invalid: { title: '여행방을 찾을 수 없어요', description: '여행방 멤버만 코스를 볼 수 있어요' },
      empty: {
        title: '아직 만든 코스가 없어요',
        description: '방장이 AI 일정을 만들면 여기에서 코스를 볼 수 있어요',
      },
      error: { title: '코스를 불러오지 못했어요', description: '잠시 후 다시 시도해 주세요' },
    }[state.status];
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<MapIcon size={20} strokeWidth={1.6} />}
          title={copy.title}
          description={copy.description}
        >
          <Button size="lg" className="h-13 w-full" onClick={goBack}>
            여행방으로 돌아가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const isHost = state.trip.myRole === 'HOST';

  const handleConfirm = async () => {
    if (!pendingCourse) return;
    setConfirming(true);
    try {
      await confirmSchedule(tripId, pendingCourse.scheduleId);
      setPendingCourse(null);
      toast.success(`${COURSE_TITLES[pendingCourse.strategy]}로 정했어요.`);
      navigate(`${tripPath}/schedule`, { replace: true });
    } catch (error) {
      const code = getApiErrorCode(error);
      setPendingCourse(null);
      if (
        code === COURSE_ERROR_CODES.candidatesSuperseded ||
        code === COURSE_ERROR_CODES.candidateNotFound
      ) {
        toast.error('코스가 새로 만들어졌어요. 바뀐 코스를 확인해 주세요.');
        setState({ status: 'loading' });
        void load();
      } else if (
        code === SCHEDULE_ERROR_CODES.changeNotAllowed ||
        code === SCHEDULE_ERROR_CODES.hostRequired
      ) {
        toast.error(getApiErrorMessage(error) ?? '지금은 코스를 정할 수 없어요.');
      } else {
        toast.error('코스를 정하지 못했어요. 다시 시도해 주세요.');
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className={styles.container}>
      <PageHeader title="경로 추천" onBack={goBack} centered />

      {isHost ? (
        <div className={styles.intro}>
          <p className={styles.introTitle}>AI가 만든 3가지 코스 중 하나를 선택해주세요</p>
          <p className={styles.introCaption}>
            선택 후에도 여행 동선 페이지에서 세부 내용을 수정할 수 있어요
          </p>
          <p className={styles.introCaption}>
            여행 전날 23:50까지 코스를 정하지 않으면 여행방이 삭제돼요
          </p>
        </div>
      ) : (
        <p className={styles.memberNotice}>그룹장만 코스를 선택할 수 있어요</p>
      )}

      <ul className={styles.courseList}>
        {state.candidates.map((course) => (
          <li key={course.scheduleId} className={styles.courseCard}>
            <h2 className={styles.courseTitle}>{COURSE_TITLES[course.strategy] ?? course.summary}</h2>
            <p className={styles.courseDescription}>{course.summary}</p>
            <dl className={styles.metrics}>
              <div>
                <dt>취향 반영도</dt>
                <dd>{course.preferenceScore !== null ? `${course.preferenceScore}%` : '-'}</dd>
              </div>
              <div>
                <dt>총 이동거리</dt>
                <dd>{formatDistance(course.totalDistanceMeters)}</dd>
              </div>
            </dl>
            <div className={styles.courseActions}>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full rounded-full text-base font-semibold"
                onClick={() =>
                  navigate(`${tripPath}/courses/${encodeURIComponent(course.scheduleId)}`)
                }
              >
                자세히 보기
              </Button>
              <Button
                size="lg"
                className="h-12 w-full rounded-full text-base font-semibold"
                disabled={!isHost}
                onClick={() => setPendingCourse(course)}
              >
                이 코스로 정하기
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingCourse !== null}
        title={pendingCourse ? `${COURSE_TITLES[pendingCourse.strategy]}로 정할까요?` : ''}
        description="정한 뒤에는 여행 일정 화면에서 장소를 추가하거나 뺄 수 있어요."
        confirmAction={{ label: '정하기', onClick: () => void handleConfirm(), disabled: confirming }}
        cancelAction={{ label: '취소', onClick: () => setPendingCourse(null), disabled: confirming }}
        onClose={() => !confirming && setPendingCourse(null)}
      />
    </main>
  );
}
