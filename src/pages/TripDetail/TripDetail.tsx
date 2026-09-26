import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckIcon, CircleAlertIcon, ClockIcon, MapIcon, PencilIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getApiErrorCode, getApiErrorMessage } from '../../api/errors';
import { generateSchedule, SCHEDULE_ERROR_CODES } from '../../api/schedule';
import { fetchSurveySummary, type SurveySummary } from '../../api/survey';
import {
  getInvitationUrl,
  getTripDetail,
  TRIP_DETAIL_ERROR_CODES,
  type TripDetail as TripDetailData,
} from '../../api/trips';
import { useAuth } from '../../auth/AuthContext';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Avatar, { AvatarGroup } from '../../components/Avatar/Avatar';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { formatExclusionName, SURVEY_CATEGORY_LABELS } from '../../constants/surveyCategories';
import { getInvitationToken } from '../../utils/invitationTokens';
import { getScheduleButtonState } from './scheduleButtonState';
import ScheduleProgress from './ScheduleProgress';
import styles from './TripDetail.module.css';

/** 새로운 멤버 참여와 설문 제출을 반영하기 위해 화면을 다시 불러오는 간격 (설계서 4·5번) */
const REFRESH_INTERVAL_MS = 15_000;
/** 초대 링크 복사 알림은 2초 뒤 사라집니다. (설계서 3번) */
const TOAST_DURATION_MS = 2000;

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; trip: TripDetailData; summary: SurveySummary }
  | { status: 'invalid' }
  | { status: 'error' };

type Generation = 'idle' | 'generating' | 'failed';

async function loadTrip(tripId: string) {
  const [trip, summary] = await Promise.all([getTripDetail(tripId), fetchSurveySummary(tripId)]);
  return { trip, summary };
}

function toLoadFailure(error: unknown): LoadState {
  const code = getApiErrorCode(error);
  // 방 참여자가 아닌 사람이 링크로 들어왔거나 없는 방이면 "잘못된 링크" 화면을 보여줍니다.
  const isInvalid =
    code === TRIP_DETAIL_ERROR_CODES.memberRequired || code === TRIP_DETAIL_ERROR_CODES.notFound;
  return isInvalid ? { status: 'invalid' } : { status: 'error' };
}

export default function TripDetail() {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [generation, setGeneration] = useState<Generation>('idle');
  const [hasSchedule, setHasSchedule] = useState(false);
  const [notice, setNotice] = useState<{ title: string; description?: string } | null>(null);
  const generatingRef = useRef(false);

  const refresh = useCallback(
    () =>
      loadTrip(tripId).then(
        (data) => setState({ status: 'ready', ...data }),
        (error: unknown) =>
          setState((previous) =>
            // 한 번 불러온 뒤의 주기적 갱신이 실패하면 기존 화면을 유지합니다.
            previous.status === 'ready' ? previous : toLoadFailure(error),
          ),
      ),
    [tripId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (generation !== 'idle') return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [generation, refresh]);

  const goToSchedule = useCallback(
    () => navigate(`/trips/${encodeURIComponent(tripId)}/schedule`),
    [navigate, tripId],
  );

  const startGeneration = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGeneration('generating');

    try {
      await generateSchedule(tripId);
      setHasSchedule(true);
      // 생성이 끝나면 생성된 여행 일정 화면으로 자동 이동합니다. (설계서 10번)
      goToSchedule();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === SCHEDULE_ERROR_CODES.alreadyExists) {
        setHasSchedule(true);
        setGeneration('idle');
        setNotice({ title: '이미 만든 일정이 있어요', description: getApiErrorMessage(error) });
      } else if (
        code === SCHEDULE_ERROR_CODES.notReady ||
        code === SCHEDULE_ERROR_CODES.accessDenied
      ) {
        setGeneration('idle');
        setNotice({ title: '아직 일정을 만들 수 없어요', description: getApiErrorMessage(error) });
        void refresh();
      } else {
        setGeneration('failed');
      }
    } finally {
      generatingRef.current = false;
    }
  };

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status === 'invalid' || state.status === 'error') {
    const isInvalid = state.status === 'invalid';
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<CircleAlertIcon size={20} strokeWidth={1.6} />}
          title={isInvalid ? '잘못된 링크예요' : '여행방을 불러오지 못했어요'}
          description={
            isInvalid
              ? '링크가 정확한지 확인하거나\n친구에게 다시 받아보세요'
              : '잠시 후 다시 시도해 주세요'
          }
        >
          <Button
            size="lg"
            className="h-13 w-full"
            onClick={() => navigate('/', { replace: true })}
          >
            홈으로 가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const { trip, summary } = state;

  if (generation === 'generating') {
    return <ScheduleProgress memberCount={summary.submittedCount} />;
  }

  if (generation === 'failed') {
    return (
      <main className={styles.centerScreen}>
        <section className={styles.failed}>
          <MapIcon className="size-16" strokeWidth={1.6} aria-hidden="true" />
          <h1 className={styles.failedTitle}>일정을 만들지 못했어요.</h1>
          <p className={styles.failedDescription}>잠시 후 다시 시도해 주세요.</p>
          <div className={styles.failedActions}>
            <Button size="lg" className="h-13 w-full" onClick={startGeneration}>
              다시 시도하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full"
              onClick={() => setGeneration('idle')}
            >
              여행방으로 돌아가기
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const isHost = trip.myRole === 'HOST';
  const submittedIds = new Set(
    summary.memberSubmissions.filter((item) => item.submitted).map((item) => item.userPublicId),
  );
  // 방장을 맨 위에, 나머지는 참여한 순서대로 보여줍니다. 같은 사람은 한 번만 보여줍니다. (설계서 5번)
  const members = [
    ...new Map(trip.members.map((member) => [member.userPublicId, member])).values(),
  ].sort((a, b) => Number(b.role === 'HOST') - Number(a.role === 'HOST'));
  const submittedMembers = members.filter((member) => submittedIds.has(member.userPublicId));
  const showSummary =
    summary.allSubmitted || (summary.deadlinePassed && summary.submittedCount > 0);
  const buttonState = getScheduleButtonState({
    isHost,
    mySurveySubmitted: summary.mySurveySubmitted,
    allSubmitted: summary.allSubmitted,
    deadlinePassed: summary.deadlinePassed,
    remainingCount: summary.activeMemberCount - summary.submittedCount,
    deadlineAt: summary.deadlineAt,
  });
  const categories = [...summary.categoryAverages].sort(
    (a, b) => b.preferencePercent - a.preferencePercent,
  );
  const surveyPath = `/trips/${encodeURIComponent(trip.tripId)}/survey`;

  return (
    <main className={styles.container}>
      <PageHeader
        title={trip.name}
        subtitle={`${trip.startDate.replaceAll('-', '.')} · ${trip.capacity}명 초대`}
        onBack={() => navigate('/')}
      />

      {/* 초대는 방장만 할 수 있고, 정원이 다 차면 보여주지 않습니다. */}
      {isHost && trip.memberCount < trip.capacity && <InviteSection tripId={trip.tripId} />}

      {showSummary ? (
        <>
          <section className={styles.card} aria-labelledby="summary-title">
            <div className={styles.summaryHeader}>
              <h2 id="summary-title" className={styles.summaryTitle}>
                우리 방 취향 종합
              </h2>
              <Badge variant="secondary" className="bg-accent">
                {summary.submittedCount}명 완료
              </Badge>
            </div>
            <ul className={styles.categoryList}>
              {categories.map((category) => (
                <li key={category.categoryCode} className={styles.categoryRow}>
                  <span className={styles.categoryName}>
                    {SURVEY_CATEGORY_LABELS[category.categoryCode] ?? category.categoryCode}
                  </span>
                  <span
                    className={styles.bar}
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={category.preferencePercent}
                    aria-label={`${SURVEY_CATEGORY_LABELS[category.categoryCode] ?? category.categoryCode} 선호도`}
                  >
                    <span
                      className={styles.barFill}
                      style={{ width: `${category.preferencePercent}%` }}
                    />
                  </span>
                  <span className={styles.percent}>{category.preferencePercent}%</span>
                </li>
              ))}
            </ul>
            {summary.excludedCategories.length > 0 && (
              <div className={styles.summaryGroup}>
                <h3 className={styles.groupTitle}>이번엔 빼드려요</h3>
                <ul className={styles.chips}>
                  {summary.excludedCategories.map((item) => (
                    <li key={item.code} className={styles.chip}>
                      {formatExclusionName(item.name)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className={`${styles.card} ${styles.submittedRow}`} aria-label="설문 완료 멤버">
            <AvatarGroup
              members={submittedMembers.map((member) => ({
                name: member.userName,
                imageUrl: member.profileImageUrl,
              }))}
            />
            <span className={styles.submittedCount}>
              {summary.submittedCount}/{summary.activeMemberCount}명 제출 완료
            </span>
          </section>
        </>
      ) : (
        <>
          <section className={styles.progress} aria-labelledby="members-title">
            <div className={styles.progressHeader}>
              <h2 id="members-title" className={styles.progressTitle}>
                참여 멤버
              </h2>
              <span className={styles.progressCount}>
                {summary.submittedCount}/{summary.activeMemberCount}명 제출 완료
              </span>
            </div>
            <span
              className={styles.bar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.progressPercent}
              aria-label="설문 제출 진행률"
            >
              <span className={styles.barFill} style={{ width: `${summary.progressPercent}%` }} />
            </span>
          </section>

          <ul className={styles.memberList}>
            {members.map((member) => {
              const submitted = submittedIds.has(member.userPublicId);
              const isMe = member.userPublicId === user?.publicId;
              return (
                <li key={member.userPublicId} className={styles.memberRow}>
                  <Avatar name={member.userName} imageUrl={member.profileImageUrl} muted={!isMe} />
                  <span className={styles.memberName}>
                    {member.userName}
                    {isMe && ' (나)'}
                  </span>
                  {submitted ? (
                    <span className={styles.submitted}>
                      <CheckIcon className="size-4" aria-hidden="true" />
                      제출완료
                    </span>
                  ) : (
                    <span className={styles.waiting}>
                      <ClockIcon className="size-3.5" aria-hidden="true" />
                      대기중
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className={styles.actions}>
        <div className={styles.actionGroup}>
          {summary.mySurveySubmitted ? (
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              disabled={summary.deadlinePassed}
              onClick={() => navigate(surveyPath)}
            >
              <PencilIcon className="size-4" aria-hidden="true" />내 설문 수정하기
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              disabled={summary.deadlinePassed}
              onClick={() => navigate(surveyPath)}
            >
              <PencilIcon className="size-4" aria-hidden="true" />
              취향 설문 하러 가기
            </Button>
          )}
          {summary.mySurveySubmitted && !summary.deadlinePassed && (
            <p className={styles.caption}>수정하면 종합 결과도 다시 계산돼요</p>
          )}
        </div>

        {hasSchedule ? (
          <div className={styles.scheduleButtons}>
            <Button
              size="lg"
              className="h-13 flex-1 text-base font-semibold"
              onClick={goToSchedule}
            >
              AI 일정 보기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 flex-1 text-base font-semibold"
              onClick={() =>
                setNotice({
                  title: '아직 일정을 다시 만들 수 없어요',
                  description: '지금은 한 번 만든 일정을 다시 만들 수 없어요.',
                })
              }
            >
              AI 일정 재생성하기
            </Button>
          </div>
        ) : (
          <div className={styles.actionGroup}>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold disabled:bg-accent disabled:text-muted-foreground disabled:opacity-100"
              disabled={!buttonState.enabled}
              onClick={startGeneration}
            >
              AI 일정 생성하기
            </Button>
            <p className={styles.caption}>{buttonState.caption}</p>
          </div>
        )}
      </div>

      <AlertDialog
        open={notice !== null}
        title={notice?.title ?? ''}
        description={notice?.description}
        primaryAction={{ label: '확인', onClick: () => setNotice(null) }}
        onClose={() => setNotice(null)}
      />
    </main>
  );
}

/**
 * 멤버 초대하기 (방장만, 설계서 3번)
 * 백엔드는 초대 토큰을 여행방을 만들 때 한 번만 알려주고 다시 조회할 수 없습니다.
 * 그래서 이 탭에서 만든 여행방만 링크를 복사할 수 있고, 그 밖에는 복사 실패로 안내합니다.
 */
function InviteSection({ tripId }: { tripId: string }) {
  const copyLink = async () => {
    const invitationToken = getInvitationToken(tripId);
    try {
      if (!invitationToken) throw new Error('초대 토큰을 알 수 없음');
      await navigator.clipboard.writeText(getInvitationUrl(invitationToken));
      toast.success('초대 링크를 복사했어요.', { duration: TOAST_DURATION_MS });
    } catch {
      toast.error('링크를 복사하지 못했어요. 다시 시도해 주세요.', { duration: TOAST_DURATION_MS });
    }
  };

  return (
    <section className={styles.invite} aria-labelledby="invite-title">
      <h2 id="invite-title" className={styles.inviteTitle}>
        멤버 초대하기
      </h2>
      <Button
        size="lg"
        variant="outline"
        className="h-11 w-full border-foreground font-semibold"
        onClick={copyLink}
      >
        초대 링크 복사
      </Button>
    </section>
  );
}
