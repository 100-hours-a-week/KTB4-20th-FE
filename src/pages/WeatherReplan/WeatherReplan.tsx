import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CircleAlertIcon, MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import { SCHEDULE_ERROR_CODES } from '../../api/schedule';
import { useAiJobs } from '../../aiJobs/AiJobContext';
import { getTripDetail } from '../../api/trips';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { UNCONFIRMED_TRIP_DELETION_TIME_LABEL } from '../../notifications/notificationDisplay';
import { isBeforeScheduleChangeDeadline } from '../../utils/date';
import ScheduleProgress from '../TripDetail/ScheduleProgress';
import styles from '../TripDetail/TripDetail.module.css';

type ReplanState =
  { status: 'generating' } | { status: 'failed' } | { status: 'unavailable'; description: string };

/** 다시 시도해도 결과가 같은 오류: 안내만 하고 여행방으로 돌려보낸다. */
const UNAVAILABLE_CODES: string[] = [
  SCHEDULE_ERROR_CODES.weatherReplanNotAvailable,
  SCHEDULE_ERROR_CODES.changeNotAllowed,
  SCHEDULE_ERROR_CODES.hostRequired,
  SCHEDULE_ERROR_CODES.notReady,
];

/**
 * 이상 기후 알림에서 방장이 "일정 변경하기"를 고르면 오는 화면.
 * 일반 생성과 같은 요청을 사유 WEATHER로 다시 보내고(날씨 반영은 AI가 맡음), 끝나면 새 코스를 고르는 화면으로 간다.
 */
export default function WeatherReplan() {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ReplanState>({ status: 'generating' });
  const requestingRef = useRef(false);
  const { requestScheduleGeneration } = useAiJobs();
  const tripPath = `/trips/${encodeURIComponent(tripId)}`;

  const replan = useCallback(async () => {
    if (requestingRef.current) return;
    requestingRef.current = true;
    try {
      // 날씨 재생성도 지금 일정을 지우고 새 코스를 고르게 해요. 코스는 전날 23:50까지만 확정할 수 있어서
      // 그 뒤에 요청하면 확정 일정 없이 여행이 시작되므로, 마감이 지났으면 요청하지 않아요.
      const trip = await getTripDetail(tripId);
      if (!isBeforeScheduleChangeDeadline(trip.startDate)) {
        setState({
          status: 'unavailable',
          description: `여행 전날 ${UNCONFIRMED_TRIP_DELETION_TIME_LABEL}이 지나 일정을 바꿀 수 없어요.\n기존 일정은 그대로 남아 있어요.`,
        });
        return;
      }
      const outcome = await requestScheduleGeneration(tripId, 'WEATHER');
      if (outcome.kind === 'accepted') {
        // 메시지 큐로 접수됐으면 여행방으로 돌아가고, 하단 진행 카드와 완료 알림으로 결과를 알려요.
        navigate(tripPath, { replace: true });
        return;
      }
      // 날씨 재생성도 기존 확정 일정을 지우고 새 코스 3가지를 만들어요. 방장이 다시 골라야 해요.
      toast.success('날씨를 반영한 코스를 새로 만들었어요.');
      navigate(`${tripPath}/courses`, { replace: true });
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === SCHEDULE_ERROR_CODES.temporarilyUnavailable) {
        // 하단 진행 카드가 거절 안내를 보여주므로 여행방으로 돌아가요.
        navigate(tripPath, { replace: true });
      } else if (code === SCHEDULE_ERROR_CODES.alreadyInProgress) {
        setState({
          status: 'unavailable',
          description: '이미 일정을 만들고 있어요.\n끝나면 알림으로 알려드려요.',
        });
      } else if (code && UNAVAILABLE_CODES.includes(code)) {
        setState({
          status: 'unavailable',
          description: getApiErrorMessage(error) ?? '지금은 일정을 바꿀 수 없어요.',
        });
      } else {
        setState({ status: 'failed' });
      }
    } finally {
      requestingRef.current = false;
    }
  }, [navigate, requestScheduleGeneration, tripId, tripPath]);

  useEffect(() => {
    void replan();
  }, [replan]);

  if (state.status === 'generating') {
    return (
      <ScheduleProgress
        title={
          <>
            날씨를 고려해서
            <br />
            최적 동선을 만드는 중이에요
          </>
        }
        steps={['날씨를 불러왔어요', '후보 장소를 찾았어요', '최적 동선을 계산하는 중']}
      />
    );
  }

  if (state.status === 'unavailable') {
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<CircleAlertIcon size={20} strokeWidth={1.6} />}
          title="일정을 바꿀 수 없어요"
          description={state.description}
        >
          <Button size="lg" className="h-13 w-full" onClick={() => navigate(tripPath)}>
            여행방으로 가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  return (
    <main className={styles.centerScreen}>
      <section className={styles.failed}>
        <MapIcon className="size-16" strokeWidth={1.6} aria-hidden="true" />
        <h1 className={styles.failedTitle}>일정을 바꾸지 못했어요.</h1>
        <p className={styles.failedDescription}>기존 일정은 그대로 남아 있어요.</p>
        <div className={styles.failedActions}>
          <Button
            size="lg"
            className="h-13 w-full"
            onClick={() => {
              setState({ status: 'generating' });
              void replan();
            }}
          >
            다시 시도하기
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-13 w-full"
            onClick={() => navigate(`${tripPath}/schedule`, { replace: true })}
          >
            기존 일정 보기
          </Button>
        </div>
      </section>
    </main>
  );
}
